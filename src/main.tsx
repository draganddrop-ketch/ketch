import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ✅ Context Provider 임포트
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LikeProvider } from './context/LikeContext'; // [새로 추가됨]
import { SectionProvider } from './context/SectionContext';
import { CanvasProvider } from './context/CanvasContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext'; // (만약 있다면)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 모든 Provider를 여기서 감싸줍니다 */}
    <AuthProvider>
      <SiteSettingsProvider>
        <SectionProvider>
          <CartProvider>
            <LikeProvider> {/* ✅ 좋아요 기능 활성화 */}
              <CanvasProvider>
                <App />
              </CanvasProvider>
            </LikeProvider>
          </CartProvider>
        </SectionProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  </StrictMode>
);