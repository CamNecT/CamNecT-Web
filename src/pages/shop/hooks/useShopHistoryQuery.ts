import { useInfiniteQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../api/axiosInstance';
import { useAuthStore } from '../../../store/useAuthStore';

export const pointHistoryKey = 'pointHistory';

type TransactionType = 'SPEND' | 'EARN';
export type PointHistoryFilter = 'ALL' | TransactionType;

export interface PointTransaction {
  id: number;
  type: TransactionType;
  source: string;
  description: string;
  pointChange: number;
  balanceAfter: number;
  createdAt: string;
}

interface PointHistoryResponse {
  status: number;
  message: string;
  data: { items: PointTransaction[]; nextCursor: number | null };
}

export const usePointHistoryQuery = (filter: PointHistoryFilter) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useInfiniteQuery({
    queryKey: [pointHistoryKey, userId, filter],
    enabled: Boolean(userId),
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam, signal }) => {
      // 서버는 거래 타입을 type으로 받으며, 생략하면 적립과 차감을 함께 조회한다.
      const { data } = await axiosInstance.get<PointHistoryResponse>('/api/points/transactions', {
        params: { type: filter === 'ALL' ? undefined : filter, cursor: pageParam },
        signal,
      });
      return data.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};
