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
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);

  const addItemToCanvas = (product: KeyringItem) => {
    const newItem: CanvasItem = {
      ...product,
      canvasId: Math.random().toString(36).substr(2, 9),
      x: 150 + (Math.random() * 40 - 20),
      y: 150 + (Math.random() * 40 - 20),
      rotation: 0,
    };
    setCanvasItems((prev) => [...prev, newItem]);
    // alert('Added to Drop Zone!'); <--- 이 줄을 삭제했습니다.
  };

  const clearCanvas = () => {
    setCanvasItems([]);
  };

  return (
    <CanvasContext.Provider value={{ canvasItems, setCanvasItems, addItemToCanvas, clearCanvas }}>
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