import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LikeContextType {
  likedItems: string[]; // 상품 ID 목록
  toggleLike: (productId: string) => void;
  isLiked: (productId: string) => boolean;
}

const LikeContext = createContext<LikeContextType | undefined>(undefined);

export const LikeProvider = ({ children }: { children: ReactNode }) => {
  const [likedItems, setLikedItems] = useState<string[]>(() => {
    // 초기 로딩 시 로컬 스토리지에서 불러오기
    try {
      const saved = localStorage.getItem('ketch_likes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ketch_likes', JSON.stringify(likedItems));
  }, [likedItems]);

  const toggleLike = (productId: string) => {
    setLikedItems(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) // 이미 있으면 삭제
        : [...prev, productId] // 없으면 추가
    );
  };

  const isLiked = (productId: string) => likedItems.includes(productId);

  return (
    <LikeContext.Provider value={{ likedItems, toggleLike, isLiked }}>
      {children}
    </LikeContext.Provider>
  );
};

export const useLike = () => {
  const context = useContext(LikeContext);
  if (!context) throw new Error('useLike must be used within a LikeProvider');
  return context;
};