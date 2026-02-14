import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { MessageSquare } from 'lucide-react'; // 카카오 아이콘 대용

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 📧 이메일 로그인
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      navigate('/'); // 메인으로 이동
    } catch (error: any) {
      alert(`로그인 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 💬 소셜 로그인 (카카오/네이버)
  const handleSocialLogin = async (provider: 'kakao' | 'naver') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          // 로그인 후 돌아올 주소 (로컬 or 배포 주소)
          redirectTo: window.location.origin, 
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(`${provider} 로그인 실패: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-md mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-10 text-center tracking-wide">LOGIN</h2>
        
        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Email</label>
            <input 
              type="email" 
              name="email" 
              required 
              value={formData.email} 
              onChange={handleChange} 
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 focus:border-green-400 outline-none transition-colors" 
              placeholder="이메일을 입력하세요" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              value={formData.password} 
              onChange={handleChange} 
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 focus:border-green-400 outline-none transition-colors" 
              placeholder="비밀번호를 입력하세요" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '이메일로 로그인'}
          </button>
        </form>

        {/* 소셜 로그인 섹션 */}
        <div className="mt-8 space-y-3">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">또는 소셜 계정으로 시작</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button 
            onClick={() => handleSocialLogin('kakao')}
            className="w-full bg-[#FEE500] text-[#3c1e1e] font-bold py-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <MessageSquare size={20} fill="currentColor" /> 카카오로 3초 만에 시작하기
          </button>

          <button 
            onClick={() => handleSocialLogin('naver')}
            className="w-full bg-[#03C75A] text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="font-black text-lg">N</span> 네이버로 시작하기
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          아직 회원이 아니신가요? <Link to="/signup" className="text-green-400 hover:underline ml-1">회원가입</Link>
        </div>
      </div>
    </div>
  );
};