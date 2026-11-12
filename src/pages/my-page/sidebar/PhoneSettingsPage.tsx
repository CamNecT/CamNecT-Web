import axios from 'axios';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import Icon from '../../../components/Icon';
import PopUp from '../../../components/Pop-up';
import SingleInput from '../../../components/common/SingleInput';
import { HeaderLayout } from '../../../layouts/HeaderLayout';
import { MainHeader } from '../../../layouts/headers/MainHeader';
import { confirmPhoneVerification, getPhoneStatus, sendPhoneVerification, updatePhone } from '../../../api/profileApi';
import type { PhoneStatusData } from '../../../api-types/profileApiTypes';
import { getServerErrorCode } from '../../../utils/getServerErrorCode';
import { shouldSkipLocalErrorUI } from '../../../utils/getGlobalNetworkErrorType';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '../utils/phone';

type PopupConfig = {
    title: string;
    content: string;
    onClose?: () => void;
};

const PHONE_ERROR_MESSAGES: Record<string, PopupConfig> = {
    '42040': {
        title: '전화번호를 확인해 주세요',
        content: '010으로 시작하는 휴대전화 번호 11자리를 입력해 주세요.',
    },
    '42041': {
        title: '전화번호 등록이 필요합니다',
        content: '전화번호를 먼저 등록한 뒤 인증을 요청해 주세요.',
    },
    '42042': {
        title: '인증 요청이 만료되었습니다',
        content: '인증번호를 다시 요청해 주세요.',
    },
    '42043': {
        title: '인증번호가 올바르지 않습니다',
        content: '문자로 받은 인증번호를 다시 확인해 주세요.',
    },
    '42940': {
        title: '이미 인증된 전화번호입니다',
        content: '현재 등록된 전화번호가 이미 인증되었습니다.',
    },
    '42941': {
        title: '인증 요청 한도를 초과했습니다',
        content: '잠시 후 다시 시도해 주세요.',
    },
    '42942': {
        title: '인증번호 입력 횟수를 초과했습니다',
        content: '인증번호를 다시 요청해 주세요.',
    },
    '42540': {
        title: '문자 인증을 사용할 수 없습니다',
        content: '잠시 후 다시 시도해 주세요.',
    },
    '42541': {
        title: '인증번호를 발송하지 못했습니다',
        content: '잠시 후 다시 요청해 주세요.',
    },
};

const getPhoneErrorPopup = (error: unknown, fallback: PopupConfig) => {
    if (!axios.isAxiosError(error)) return fallback;
    const code = getServerErrorCode(error);
    return code ? (PHONE_ERROR_MESSAGES[code] ?? fallback) : fallback;
};

const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

const PhoneSettingsForm = ({ initialStatus }: { initialStatus: PhoneStatusData }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    //번호가 저장되어 있어도 인증 전이면 등록 절차가 아직 완료되지 않은 상태로 본다
    const isRegistration = !initialStatus.phoneVerified;
    const [phoneNumber, setPhoneNumber] = useState(
        initialStatus.phoneNum && !initialStatus.phoneVerified
        ? formatPhoneNumber(initialStatus.phoneNum)
        : '',
    );
    const [verificationCode, setVerificationCode] = useState('');
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [expiresIn, setExpiresIn] = useState(0);
    const [resendAfter, setResendAfter] = useState(0);
    const [phoneError, setPhoneError] = useState('');
    const [codeError, setCodeError] = useState('');
    const [popup, setPopup] = useState<PopupConfig | null>(null);
    const isTimerActive = expiresIn > 0 || resendAfter > 0;

    useEffect(() => {
        if (!isTimerActive) return;
        const timer = window.setInterval(() => {
            setExpiresIn((value) => Math.max(0, value - 1));
            setResendAfter((value) => Math.max(0, value - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [isTimerActive]);

    const requestMutation = useMutation({
        mutationFn: async () => {
            const normalizedPhone = normalizePhoneNumber(phoneNumber);
            const updated = await updatePhone({ phoneNum: normalizedPhone });
            if (updated.data.phoneVerified) return { alreadyVerified: true as const };
            const sent = await sendPhoneVerification();
            return { alreadyVerified: false as const, sent };
        },
        retry: false,
        onMutate: () => {
            setPhoneError('');
        },
        onSuccess: (result) => {
            void queryClient.invalidateQueries({ queryKey: ['setting'] });
            if (result.alreadyVerified) {
                setPopup(PHONE_ERROR_MESSAGES['42940']);
                return;
            }
            setChallengeId(result.sent.data.challengeId);
            setExpiresIn(result.sent.data.expiresInSeconds);
            setResendAfter(result.sent.data.resendAfterSeconds);
            setVerificationCode('');
            setCodeError('');
            setPopup({
                title: '인증번호를 전송했습니다',
                content: '문자로 받은 6자리 인증번호를 입력해 주세요.',
            });
        },
        onError: (error) => {
            if (shouldSkipLocalErrorUI(error, navigator.onLine)) return;
            const errorCode = axios.isAxiosError(error) ? getServerErrorCode(error) : undefined;
            if (errorCode === '42040') {
                setPhoneError('010으로 시작하는 휴대전화 번호 11자리를 입력해 주세요.');
                return;
            }
            if (errorCode === '42041') {
                setPhoneError('전화번호를 먼저 등록해 주세요.');
                return;
            }
            if (errorCode === '42941') {
                setPhoneError('인증 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.');
                return;
            }
            setPopup(
                getPhoneErrorPopup(error, {
                title: '인증번호를 요청하지 못했습니다',
                content: '잠시 후 다시 시도해 주세요.',
                }),
            );
        },
    });

    const confirmMutation = useMutation({
        mutationFn: () =>
        confirmPhoneVerification({
            challengeId: challengeId!,
            code: verificationCode,
        }),
        retry: false,
        onMutate: () => {
            setCodeError('');
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['setting'] });
            setPopup({
                title: isRegistration ? '전화번호 등록이 완료되었습니다' : '전화번호가 변경되었습니다',
                content: '인증된 전화번호가 계정에 반영되었습니다.',
                onClose: () => {
                    void queryClient.invalidateQueries({ queryKey: ['phoneStatus'] });
                    navigate(-1);
                },
            });
        },
        onError: (error) => {
            if (shouldSkipLocalErrorUI(error, navigator.onLine)) return;
            const errorCode = axios.isAxiosError(error) ? getServerErrorCode(error) : undefined;
            if (errorCode === '42043') {
                setCodeError('인증번호가 올바르지 않습니다.');
                return;
            }
            if (errorCode === '42042') {
                setChallengeId(null);
                setExpiresIn(0);
                setCodeError('인증 시간이 만료되었습니다. 인증번호를 다시 요청해 주세요.');
                return;
            }
            if (errorCode === '42942') {
                setChallengeId(null);
                setExpiresIn(0);
                setCodeError('인증번호 입력 횟수를 초과했습니다. 인증번호를 다시 요청해 주세요.');
                return;
            }
            setPopup(
                getPhoneErrorPopup(error, {
                    title: '전화번호를 인증하지 못했습니다',
                    content: '잠시 후 다시 시도해 주세요.',
                }),
            );
        },
    });

    const handlePhoneChange = (value: string) => {
        setPhoneNumber(formatPhoneNumber(value));
        setPhoneError('');
        if (challengeId) {
            setChallengeId(null);
            setExpiresIn(0);
            setResendAfter(0);
            setVerificationCode('');
        }
    };

    const canRequest = isValidPhoneNumber(phoneNumber) && resendAfter === 0 && initialStatus.smsAvailable;
    const canConfirm = Boolean(challengeId) && expiresIn > 0 && /^\d{6}$/.test(verificationCode);

    return (
        <>
            <HeaderLayout
                headerSlot={
                <MainHeader
                    title={isRegistration ? '전화번호 등록' : '전화번호 변경'}
                    leftAction={{ onClick: () => navigate(-1) }}
                />
                }
            >
                <div className='flex h-full w-full flex-col flex-1 justify-between bg-white px-[25px] pb-[30px] pt-[30px]'>
                    <div className='flex flex-col gap-[20px]'>
                        {!isRegistration ? (
                            <p className='text-m-14-hn text-gray-900'>변경된 전화번호를 입력해 주세요</p>
                        ) : null}

                        <SingleInput
                            type='tel'
                            inputMode='numeric'
                            autoComplete='tel'
                            value={phoneNumber}
                            placeholder='전화번호를 입력해 주세요'
                            error={phoneError}
                            onChange={(event) => handlePhoneChange(event.target.value)}
                            action={
                                <Button
                                    type='button'
                                    label={challengeId ? '재요청' : '인증요청'}
                                    font='m-16-hn'
                                    className='h-[48px] w-[74px] rounded-[5px] px-[6px] text-white'
                                    disabled={!canRequest}
                                    loading={requestMutation.isPending}
                                    onClick={() => requestMutation.mutate()}
                                />
                            }
                        />

                        <SingleInput
                            type='text'
                            inputMode='numeric'
                            value={verificationCode}
                            placeholder='인증 번호 6자리를 입력해 주세요'
                            maxLength={6}
                            disabled={!challengeId || expiresIn <= 0}
                            error={codeError}
                            onChange={(event) => {
                                setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                                setCodeError('');
                            }}
                            rightIcon={expiresIn > 0 ? (
                                <span className='text-r-12-hn text-gray-750'>{formatTimer(expiresIn)}</span>
                            ) : undefined}
                            inputClassName={expiresIn > 0 ? 'pr-[60px]' : ''}
                        />

                        {!initialStatus.smsAvailable ? (
                        <p className='text-r-12 text-gray-750'>현재 문자 인증을 사용할 수 없습니다.</p>
                        ) : null}

                        <div className='mt-[5px] flex flex-col gap-[10px] text-r-12 leading-[150%] text-gray-650'>
                        {[
                          '안전한 캠넥트 사용을 위해 전화번호를 확인해 주세요.',
                          '이 기기에 인증된 전화번호를 다른 사람이 인증하는 경우, 내 인증이 해제되거나 캠넥트 이용이 제한될 수 있습니다.',
                          '전화번호가 변경된 경우, 추후 계정 관리 탭에서 변경된 번호를 다시 인증해주세요.',
                        ].map((message) => (
                          <p key={message} className='flex items-start gap-[5px]'>
                            <Icon
                              name='error_circle_stroke'
                              size={13}
                              className='mt-[2px] text-gray-650'
                            />
                            <span>{message}</span>
                          </p>
                        ))}
                        </div>
                    </div>

                    <Button
                        type='button'
                        label={isRegistration ? '등록 완료' : '전화번호 변경'}
                        disabled={!canConfirm}
                        loading={confirmMutation.isPending}
                        className='max-w-none'
                        onClick={() => confirmMutation.mutate()}
                    />
                </div>
            </HeaderLayout>

            {popup ? (
                <PopUp
                isOpen
                type='confirm'
                title={popup.title}
                content={popup.content}
                onClick={() => {
                    const onClose = popup.onClose;
                    setPopup(null);
                    onClose?.();
                }}
                />
            ) : null}

            <PopUp
                isOpen={requestMutation.isPending}
                type='loading'
                title='인증번호를 전송하고 있습니다...'
            />
        </>
    );
};

export const PhoneSettingsPage = () => {
    const navigate = useNavigate();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['phoneStatus'],
        queryFn: getPhoneStatus,
        retry: false,
    });

    if (isLoading) return <PopUp type='loading' isOpen />;
    if (isError || !data?.data) {
        return (
        <PopUp
            type='error'
            title='전화번호 정보를 불러오지 못했습니다'
            content='잠시 후 다시 시도해 주세요.'
            isOpen
            onClick={() => navigate(-1)}
        />
        );
    }

    return <PhoneSettingsForm initialStatus={data.data} />;
};
