import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Admin } from './pages/Admin';
import { AdminLogin } from './pages/AdminLogin';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Cart } from './pages/Cart';
import Profile from './pages/Profile';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SectionProvider } from './context/SectionContext';

function App() {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <CartProvider>
          <SectionProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </Router>
          </SectionProvider>
        </CartProvider>
      </AuthProvider>
    </SiteSettingsProvider>
  );
}

export default App;
