import DaumPostcode from 'react-daum-postcode';
import { X } from 'lucide-react';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export const AddressModal = ({ isOpen, onClose, onComplete }: AddressModalProps) => {
  if (!isOpen) return null;

  const handleComplete = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = '';

    if (data.addressType === 'R') {
      if (data.bname !== '') extraAddress += data.bname;
      if (data.buildingName !== '') extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
      fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
    }

    // 부모 컴포넌트에 선택된 주소 전달 (우편번호, 주소)
    onComplete({
      zonecode: data.zonecode,
      address: fullAddress,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg overflow-hidden shadow-2xl relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg text-gray-800">주소 검색</h3>
          <button onClick={onClose}><X className="text-gray-500 hover:text-black" /></button>
        </div>
        <div className="h-[500px]">
          <DaumPostcode onComplete={handleComplete} style={{ height: '100%' }} />
        </div>
      </div>
    </div>
  );
};