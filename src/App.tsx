import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Admin } from './pages/Admin';
import { AdminLogin } from './pages/AdminLogin';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Cart } from './pages/Cart';
import Profile from './pages/Profile';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SectionProvider } from './context/SectionContext';
import { CanvasProvider } from './context/CanvasContext';

// ★ 강화된 관리자 보안 문지기
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  
  // 🚨 [필수 수정] 여기에 실제 관리자 이메일을 적어주세요! 🚨
  // (대소문자 구분 없이 비교하겠지만, 가급적 정확히 적어주세요)
  const ADMIN_EMAIL = 'jeongyong01@naver.com'; 

  if (loading) {
    // 로딩 중일 때는 아무것도 안 보여줌 (보안 구멍 막기)
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Checking permission...</div>; 
  }

  // 디버깅용 로그 (범인 색출용)
  console.log("🕵️‍♂️ 보안 검사 중...");
  console.log(" - 현재 접속자:", user ? user.email : "비로그인 손님");
  console.log(" - 허용된 관리자:", ADMIN_EMAIL);

  // 1. 로그인을 아예 안 했다면? -> 관리자 로그인 페이지로 보냄
  if (!user) {
    console.log("⛔ 결과: 로그인 안 함 -> 쫓아냄");
    return <Navigate to="/admin/login" replace />;
  }

  // 2. 로그인은 했는데, 이메일이 다르다면? -> 메인 홈페이지로 쫓아냄
  // (toLowerCase()를 써서 대문자/소문자 차이로 뚫리는 문제 해결)
  if (user.email?.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase().trim()) {
    console.log("⛔ 결과: 이메일 불일치 (일반 고객) -> 홈으로 쫓아냄");
    alert("관리자만 접근할 수 있는 페이지입니다."); // 경고창 띄우기
    return <Navigate to="/" replace />;
  }

  // 3. 통과!
  console.log("✅ 결과: 관리자 확인됨! 어서오세요.");
  return children;
};

function App() {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <CartProvider>
          <SectionProvider>
            <CanvasProvider>
              <Router>
                <Routes>
                  {/* 일반 고객용 페이지 */}
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/profile" element={<Profile />} />
                  
                  {/* 관리자 로그인 페이지 */}
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* ★ 철통 보안! 관리자 메인 페이지 */}
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <Admin />
                      </AdminRoute>
                    } 
                  />
                </Routes>
              </Router>
            </CanvasProvider>
          </SectionProvider>
        </CartProvider>
      </AuthProvider>
    </SiteSettingsProvider>
  );
}

export default App;