import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { viewChatRoomList } from '../../../api/chat';
import { getRequestErrorKind, type RequestErrorPopupConfig } from '../../../components/requestErrorPopup';
import { useAuthStore } from '../../../store/useAuthStore';
import { shouldSkipLocalErrorUI } from '../../../utils/getGlobalNetworkErrorType';

type ChatRoomError = RequestErrorPopupConfig & { title?: string; content?: string };

export const useAlumniChatRoom = (onError: (error: ChatRoomError) => void) => {
  const navigate = useNavigate();
  const pendingRef = useRef(false);
  const lookup = useMutation({
    mutationFn: ({ userId }: { userId: number; opponentId: string }) =>
      viewChatRoomList({ userId, type: 'COFFEE_CHAT' }),
  });

  const openChatRoom = (opponentId: string) => {
    if (pendingRef.current) return;

    const loginId = useAuthStore.getState().user?.id;
    const userId = Number(loginId);
    if (!loginId || !Number.isSafeInteger(userId) || userId <= 0) {
      onError({ title: '로그인 필요', content: '채팅방은 로그인 후 이용할 수 있습니다.' });
      return;
    }

    pendingRef.current = true;
    // hasChat에는 방 ID가 없으므로 상대방과 연결된 활성 커피챗 방을 조회한다.
    lookup.mutate({ userId, opponentId }, {
      onSuccess: (response, target) => {
        if (useAuthStore.getState().user?.id !== loginId) return;

        const room = response.data.chatRoomList.find((item) =>
          String(item.opponentId) === target.opponentId && !item.closed && !item.opponentExited,
        );
        if (room) {
          navigate(`/chat/${room.roomId}`);
        } else {
          onError({
            title: '채팅방을 찾을 수 없어요',
            content: '채팅방이 종료되었거나 상태가 변경되었습니다. 화면을 새로고침해 주세요.',
          });
        }
      },
      onError: (error) => {
        if (useAuthStore.getState().user?.id !== loginId) return;
        if (shouldSkipLocalErrorUI(error, navigator.onLine)) return;

        const requestError = getRequestErrorKind(error);
        onError(requestError
          ? { requestError }
          : {
              title: '채팅방을 불러오지 못했어요',
              content: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
            });
      },
      onSettled: () => { pendingRef.current = false; },
    });
  };

  return {
    openChatRoom,
    pendingOpponentId: lookup.isPending ? lookup.variables.opponentId : undefined,
  };
};
