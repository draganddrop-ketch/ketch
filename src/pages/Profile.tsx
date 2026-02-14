import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { supabase } from '../lib/supabase';
// ✅ [핵심 수정] 'Save'와 'ShieldAlert'가 반드시 포함되어야 합니다.
import { User, Settings, Edit, Package, LogOut, Save, ShieldAlert } from 'lucide-react';
import { SiteSettingsForm } from '../components/SiteSettingsForm';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  role?: string;
}

export const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings } = useSiteSettings();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 전역 스타일 설정
  const globalBg = settings?.global_bg_color || '#000000';
  const globalText = settings?.global_text_color || '#FFFFFF';
  const accentColor = settings?.accent_color || '#34d399';
  const borderColor = settings?.layout_border_color || 'rgba(255, 255, 255, 0.3)';

  useEffect(() => {
    const getProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setProfile(data);
        } else {
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: '',
            phone: '',
            address: '',
            avatar_url: '',
            role: 'user'
          });
        }
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      setUpdating(true);
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert('Profile updated!');
      setActiveTab('overview');
    } catch (err) {
      alert('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white">LOADING...</div>;
  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ backgroundColor: globalBg, color: globalText }}>
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-10 uppercase tracking-widest">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
          {/* 사이드바 */}
          <div className="flex flex-col gap-3">
            <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white/10 font-bold' : 'hover:bg-white/5 opacity-60'}`}>
              <User size={20} /> Overview
            </button>
            <button onClick={() => setActiveTab('edit')} className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${activeTab === 'edit' ? 'bg-white/10 font-bold' : 'hover:bg-white/5 opacity-60'}`}>
              <Edit size={20} /> Edit Profile
            </button>
            <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-white/10 font-bold' : 'hover:bg-white/5 opacity-60'}`}>
              <Package size={20} /> Orders
            </button>
            
            {profile?.role === 'admin' && (
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white/10 font-bold' : 'hover:bg-white/5 opacity-60'}`}>
                <Settings size={20} /> Shop Settings
              </button>
            )}

            <button onClick={() => signOut()} className="flex items-center gap-3 px-5 py-4 rounded-xl hover:bg-red-500/10 text-red-400 mt-6 transition-all border border-transparent hover:border-red-500/20">
              <LogOut size={20} /> Sign Out
            </button>
          </div>

          {/* 메인 영역 */}
          <div className="min-h-[550px] border rounded-3xl p-8" style={{ borderColor: borderColor }}>
            
            {/* Overview 탭 */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border-2 border-dashed" style={{ borderColor: accentColor }}>
                    <User size={40} className="opacity-30" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{profile?.full_name || 'Guest'}</h2>
                    <p className="opacity-50 mt-1">{user.email}</p>
                    <div className="mt-3 inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-tighter" style={{ color: accentColor }}>
                      {profile?.role === 'admin' ? 'Administrator' : 'Member'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t" style={{ borderColor: borderColor }}>
                  <div>
                    <h4 className="text-xs uppercase opacity-40 font-bold mb-2">Phone</h4>
                    <p className="text-lg">{profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase opacity-40 font-bold mb-2">Address</h4>
                    <p className="text-lg leading-relaxed">{profile?.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Profile 탭 - 여기서 Save 아이콘 사용됨 */}
            {activeTab === 'edit' && profile && (
              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
                <h3 className="text-xl font-bold mb-8">Personal Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase opacity-50">Full Name</label>
                    <input type="text" value={profile.full_name || ''} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="w-full bg-white/5 border px-5 py-4 rounded-xl outline-none focus:border-white/40 transition-all" style={{ borderColor: borderColor }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase opacity-50">Phone Number</label>
                    <input type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full bg-white/5 border px-5 py-4 rounded-xl outline-none focus:border-white/40 transition-all" style={{ borderColor: borderColor }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase opacity-50">Shipping Address</label>
                    <textarea rows={3} value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="w-full bg-white/5 border px-5 py-4 rounded-xl outline-none focus:border-white/40 transition-all resize-none" style={{ borderColor: borderColor }} />
                  </div>
                </div>
                {/* ⬇️ 이 부분에서 Save 컴포넌트가 사용됩니다 */}
                <button type="submit" disabled={updating} className="px-10 py-4 rounded-xl font-bold text-black mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: accentColor }}>
                  <Save size={18} /> {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {/* Orders 탭 */}
            {activeTab === 'orders' && (
              <div className="flex flex-col items-center justify-center h-full opacity-30 py-20">
                <Package size={60} strokeWidth={1} className="mb-4" />
                <p className="text-sm font-medium">No recent orders</p>
              </div>
            )}

            {/* Settings 탭 - 여기서 ShieldAlert 사용됨 */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                {profile?.role === 'admin' ? (
                  <>
                    <h3 className="text-xl font-bold">Admin Store Control</h3>
                    <SiteSettingsForm />
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                    <ShieldAlert size={20} />
                    <p className="text-sm font-bold">Access restricted to administrators.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};