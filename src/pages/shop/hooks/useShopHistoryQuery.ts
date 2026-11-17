import { useInfiniteQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../api/axiosInstance';
import { useAuthStore } from '../../../store/useAuthStore';

export const pointHistoryKey = 'pointHistory';
export const purchaseHistoryKey = 'gifticonPurchaseHistory';

export type PointHistoryFilter = 'ALL' | 'SPEND' | 'EARN';

interface PointTransaction {
  id: number;
  type: Exclude<PointHistoryFilter, 'ALL'>;
  source: string;
  description: string;
  pointChange: number;
  balanceAfter: number;
  createdAt: string;
}

interface GifticonPurchase {
  purchaseId: number;
  productId: number;
  productName: string;
  brandName: string;
  imageUrl: string | null;
  quantity: number;
  unitPricePoints: number;
  totalPricePoints: number;
  requestedAt: string;
  processedAt: string | null;
  processingSuccess: boolean | null;
}

interface HistoryResponse<Item> {
  status: number;
  message: string;
  data: { items: Item[]; nextCursor: number | null };
}

export const usePointHistoryQuery = (filter: PointHistoryFilter) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useInfiniteQuery({
    queryKey: [pointHistoryKey, userId, filter],
    enabled: Boolean(userId),
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam, signal }) => {
      // 전체 보기는 type을 생략하고, 필터별 커서는 서버가 반환한 값을 사용한다.
      const { data } = await axiosInstance.get<HistoryResponse<PointTransaction>>('/api/points/transactions', {
        params: { type: filter === 'ALL' ? undefined : filter, cursor: pageParam },
        signal,
      });
      return data.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const usePurchaseHistoryQuery = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useInfiniteQuery({
    queryKey: [purchaseHistoryKey, userId],
    enabled: Boolean(userId),
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await axiosInstance.get<HistoryResponse<GifticonPurchase>>('/api/gifticons/purchases', {
        params: { cursor: pageParam },
        signal,
      });
      return data.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};
