import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import { supabase } from './lib/supabase';

const SUPER_ADMIN_EMAILS = ['jeongyong01@naver.com'].map((email) => email.toLowerCase().trim());

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async () => {
      if (!user) {
        if (isMounted) {
          setIsAdmin(null);
          setCheckingRole(false);
        }
        return;
      }

      const userEmail = user.email?.toLowerCase().trim() || '';
      if (SUPER_ADMIN_EMAILS.includes(userEmail)) {
        if (isMounted) {
          setIsAdmin(true);
          setCheckingRole(false);
        }
        return;
      }

      setCheckingRole(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) return;
      if (error) {
        console.error('Failed to check admin role:', error);
        setIsAdmin(SUPER_ADMIN_EMAILS.includes(userEmail));
      } else {
        const profileEmail = data?.email?.toLowerCase().trim() || '';
        const hasAdminRole = (data?.role || 'user') === 'admin';
        const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(userEmail) || SUPER_ADMIN_EMAILS.includes(profileEmail);
        setIsAdmin(hasAdminRole || isSuperAdminEmail);
      }
      setCheckingRole(false);
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading || (user && (checkingRole || isAdmin === null))) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Checking permission...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

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
