import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { supabase } from '../lib/supabase';

export const AdminLogin = () => {
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const primaryColor = settings?.primary_color || '#34d399';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      console.log('Login response:', {
        success: !!data.user,
        error: error?.message,
        data: data
      });

      if (error) {
        console.error('Login failed:', error);
        setError(error.message || 'Invalid login credentials');
        setLoading(false);
        return;
      }

      console.log('Login successful! User:', data.user?.email);
      navigate('/admin');
    } catch (err) {
      console.error('Login exception:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white mb-2">
            <span style={{ color: primaryColor }}>ADMIN</span>_LOGIN
          </h1>
          <p className="text-xs text-zinc-500">SECURE_AUTHENTICATION_REQUIRED</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-8">
          {error && (
            <div className="mb-6 px-4 py-3 border border-red-600/50 bg-red-500/10">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs text-zinc-400 block mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-white outline-none transition-colors"
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = '#3f3f46'}
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-2">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-white outline-none transition-colors"
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = '#3f3f46'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-black font-mono py-3 transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
              style={{
                backgroundColor: loading ? '#3f3f46' : primaryColor,
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
            >
              <LogIn size={16} />
              {loading ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 text-center">
              AUTHORIZED_PERSONNEL_ONLY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
