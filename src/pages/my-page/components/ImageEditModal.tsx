import Icon from "../../../components/BottomSheetModal/Icon";
import { useRef } from "react";
import BottomSheetModal from "../../../components/BottomSheetModal/BottomSheetModal";

interface ImageEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (file: File, source: "album" | "camera") => void;
    onDelete: () => void;
}

export default function ImageEditModal({ isOpen, onClose, onSelect, onDelete }: ImageEditModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAlbumSelect = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, source: "album" | "camera") => {
        const file = e.target.files?.[0];
        if (file) onSelect(file, source);
        e.target.value = "";
    };

    return (
        <BottomSheetModal isOpen={isOpen} onClose={onClose} height="auto">
            <div className="w-full px-[25px] pt-[10px] pb-[30px] flex flex-col">
                <button
                    onClick={handleAlbumSelect}
                    className="flex items-center gap-[15px] pl-[10px] py-[15px] border-b border-gray-150"
                    type="button"
                >
                    <Icon name="image" className="w-[20px] h-[20px] block shrink-0" />
                    <span className="text-m-16 text-gray-750">프로필 사진 변경</span>                    
                </button>
                <button
                    onClick={onDelete}
                    className="flex items-center gap-[15px] pl-[10px] py-[15px]"
                    type="button"
                >
                    <Icon name="trash" className="w-[20px] h-[20px] block shrink-0" />
                    <span className="text-R-16 text-red">사진 삭제</span>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/webp, image/jpeg"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'album')}
                />
            </div>
        </BottomSheetModal>
    );
}
