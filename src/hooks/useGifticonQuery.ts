import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { GifticonProduct, GifticonPurchaseRequest } from "../api-types/gifticonApiTypes";
import { purchaseProduct, viewGifticonList, viewGifticonProduct } from "../api/gifticon";
import { useAuthStore } from "../store/useAuthStore";
import { usePointStore } from "../store/usePointStore";

// data.ts의 ShopItem 형식으로 매핑하는 헬퍼 함수
const mapToShopItem = (product: GifticonProduct) => ({
    id: product.productId,
    company: product.brandName,
    name: product.productName,
    point: product.pricePoints,
    imageUrl: product.imageUrl,
    active: product.active,
});

// 기프티콘 리스트 조회
export const useGifticonListQuery = () => {
    const {user} = useAuthStore();
    const setPoint = usePointStore((state) => state.setPoint);
    
    const query = useQuery({
        queryKey: ['gifticonList', user?.id],
        queryFn: async () => {
            const response = await viewGifticonList({
                userId: Number(user?.id)
            })
            return {
                myPoint: response.data.myPoint,
                email: response.data.email,
                shopItems: response.data.products
                    .filter((product) => product.active)
                    .map(mapToShopItem),
                lastSyncedAt: response.data.lastSyncedAt
            };
        },
        enabled: !!user?.id,
        staleTime: 30 * 1000
    })

    // 구매 가능 금액 판단과 홈 포인트 표시가 같은 값을 사용하도록 서버 포인트를 동기화합니다.
    useEffect(() => {
        if (query.data?.myPoint !== undefined) {
            setPoint(query.data.myPoint);
        }
    }, [query.data?.myPoint, setPoint]);

    return query;
}

// 기프티콘 상세 조회
export const useGifticonProductQuery = (productId: string | undefined) => {
    
    return useQuery({
        queryKey: ['gifticonProduct', productId],
        queryFn: async () => {
            const response = await viewGifticonProduct({
                productId: Number(productId)
            })
            return mapToShopItem(response.data);
        },
        enabled: !!productId,
        staleTime: 60 * 60 * 10000
    })
}

type PurchaseMutationParams = Omit<GifticonPurchaseRequest, 'userId'>;

// 기프티콘 구매
export const useGifticonPurchaseMutation = () => {
    const {user} = useAuthStore();
    const deductPoint = usePointStore((state) => state.deductPoint);
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (params: PurchaseMutationParams) => {
            const response = await purchaseProduct({
                ...params,
                userId: Number(user?.id)
            })
            return response.data;
        },
        onSuccess: (_, variables) => {
            deductPoint(variables.spendPoints);

            queryClient.invalidateQueries({ queryKey: ['gifticonList'] });
            queryClient.invalidateQueries({ queryKey: ['home'] });
        }
    })
}
