import React, { createContext, useContext, useState, ReactNode } from 'react';
import { KeyringItem } from '../types';

interface CanvasItem extends KeyringItem {
  canvasId: string;
  x: number;
  y: number;
  rotation: number;
}

interface CanvasContextType {
  canvasItems: CanvasItem[];
  setCanvasItems: (items: CanvasItem[]) => void;
  addItemToCanvas: (product: KeyringItem) => void;
  clearCanvas: () => void;
  // ★ 추가된 부분: 선택된 아이템 ID 관리
  selectedId: string | null;
  selectItem: (id: string | null) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  // ★ 추가된 부분: 선택 상태 관리
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addItemToCanvas = (product: KeyringItem) => {
    const newItem: CanvasItem = {
      ...product,
      canvasId: Math.random().toString(36).substr(2, 9),
      x: 150 + (Math.random() * 40 - 20),
      y: 150 + (Math.random() * 40 - 20),
      rotation: 0,
    };
    setCanvasItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.canvasId); // 추가하자마자 선택되게 (편의성)
  };

  const selectItem = (id: string | null) => {
    setSelectedId(id);
  };

  const clearCanvas = () => {
    setCanvasItems([]);
    setSelectedId(null);
  };

  return (
    <CanvasContext.Provider value={{ 
      canvasItems, 
      setCanvasItems, 
      addItemToCanvas, 
      clearCanvas,
      selectedId,      // ★ 내보내기
      selectItem       // ★ 내보내기
    }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};