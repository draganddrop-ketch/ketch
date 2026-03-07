import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface LikeContextType {
  likedItems: string[]; // 상품 ID 목록
  toggleLike: (productId: string) => void;
  isLiked: (productId: string) => boolean;
}

const LikeContext = createContext<LikeContextType | undefined>(undefined);

export const LikeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [likedItems, setLikedItems] = useState<string[]>([]);

  useEffect(() => {
    const loadLocal = () => {
      try {
        const saved = localStorage.getItem('ketch_likes');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    };

    if (!user) {
      setLikedItems(loadLocal());
      return;
    }

    const fetchLikes = async () => {
      const { data, error } = await supabase
        .from('likes')
        .select('product_id')
        .eq('user_id', user.id);
      if (error) {
        console.error('Failed to fetch likes', error);
        setLikedItems(loadLocal());
        return;
      }
      const remote = (data || []).map((row: any) => row.product_id);
      const local = loadLocal();
      setLikedItems(remote.length > 0 ? remote : local);
    };

    fetchLikes();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ketch_likes', JSON.stringify(likedItems));
  }, [likedItems]);

  const toggleLike = async (productId: string) => {
    const alreadyLiked = likedItems.includes(productId);
    setLikedItems(prev => 
      alreadyLiked 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );

    if (!user) return;

    const { error } = alreadyLiked
      ? await supabase.from('likes').delete().eq('user_id', user.id).eq('product_id', productId)
      : await supabase.from('likes').insert({ user_id: user.id, product_id: productId });

    if (error) {
      console.error('Failed to update likes', error);
    }
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
