import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { GLOBAL_OFFLINE_POPUP_MESSAGE } from '../constants/serverErrors/globalNetworkErrors';
import { useGlobalOfflineStore } from '../store/useGlobalOfflineStore';
import Icon from './Icon';

const GlobalOfflineBanner = () => {
  const isOffline = useGlobalOfflineStore((state) => state.isOffline);
  const reduceMotion = useReducedMotion();
  const hiddenY = reduceMotion ? 0 : 'calc(-100% - 58px - 8px)';

  // 전역 연결 안내는 모달 상태·스크롤 잠금·클릭 처리에 관여하지 않는다.
  // body 포털과 별도 레이어로 기존 팝업 위에 표시하고, 복구 시 퇴장 애니메이션 후 제거한다.
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[58px] z-[10000] flex justify-center" role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {isOffline && (
          <motion.div
            key="global-offline"
            initial={{ y: hiddenY, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: hiddenY, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
            className="flex min-h-10 w-80 max-w-[calc(100%-32px)] items-center gap-1.5 rounded-[5px] bg-neutral-50 px-[15px] py-2 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)]"
          >
            <span aria-hidden="true" className="flex shrink-0">
              <Icon name="error_circle" size={24} className="text-red" />
            </span>
            <p className="min-w-0 break-words font-sans text-base font-normal leading-6 text-gray-750">
              {GLOBAL_OFFLINE_POPUP_MESSAGE}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
};

export default GlobalOfflineBanner;
