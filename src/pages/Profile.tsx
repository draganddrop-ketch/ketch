import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingCart, Settings, Trash2, Share2, ZoomIn, Edit2, CreditCard, X, Package, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext'; // ✅ 설정 가져오기
import { CanvasPreview } from '../components/CanvasPreview';
import { AddressModal } from '../components/AddressModal'; 

interface UserProfile { id: string; email: string; full_name: string | null; created_at: string; username?: string; phone?: string; zipcode?: string; address?: string; address_detail?: string; birthday?: string; gender?: string; is_agreed_marketing?: boolean; }
interface Order { id: string; order_date: string; status: string; total_price: number; custom_image_url: string | null; items: Array<{ id: string; name: string; price: number; quantity: number; }>; }
interface SavedDesign { id: string; design_name: string; snapshot_image: string; created_at: string; design_data: any; total_price?: number; }
type TabType = 'ORDER_HISTORY' | 'SAVED_DESIGNS' | 'SETTINGS';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { settings, getBorderStyle } = useSiteSettings(); // ✅ 설정 사용
  
  const [activeTab, setActiveTab] = useState<TabType>('SAVED_DESIGNS');
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editForm, setEditForm] = useState<UserProfile | null>(null);

  // ✅ 전역 스타일 변수 적용
  const bgColor = settings?.global_bg_color || '#000000';
  const textColor = settings?.global_text_color || '#FFFFFF';
  const borderStyle = getBorderStyle();

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchProfileAndOrders(); }, [user, navigate]);

  const fetchProfileAndOrders = async () => {
    if (!user) return;
    try {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const { data: designsData } = await supabase.from('saved_designs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      const { data: ordersData } = await supabase.from('orders').select('*').eq('user_id', user.id).order('order_date', { ascending: false });
      
      const userProfile: UserProfile = { id: user.id, email: user.email || '', full_name: profileData?.full_name || null, created_at: user.created_at || new Date().toISOString(), username: profileData?.username, phone: profileData?.phone, zipcode: profileData?.zipcode, address: profileData?.address, address_detail: profileData?.address_detail, birthday: profileData?.birthday, gender: profileData?.gender, is_agreed_marketing: profileData?.is_agreed_marketing };
      setProfile(userProfile); setEditForm(userProfile); setOrders(ordersData || []); setSavedDesigns(designsData || []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const handleDeleteDesign = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('saved_designs').delete().eq('id', id); setSavedDesigns(prev => prev.filter(d => d.id !== id)); if (selectedDesign?.id === id) { setShowDetailModal(false); setSelectedDesign(null); } };
  const handleAddToCart = (design: SavedDesign) => { if (design.design_data?.items) { addToCart({ id: `design-${design.id}`, name: design.design_name, price: design.total_price || 0, image: design.snapshot_image, quantity: 1, items: design.design_data.items }); alert('Added to cart!'); } };
  const handleOrder = (design: SavedDesign) => { handleAddToCart(design); navigate('/cart'); };
  const handleShare = (design: SavedDesign) => { navigator.clipboard.writeText(`${window.location.origin}/design/${design.id}`).then(() => alert('Link copied!')).catch(() => alert('Failed')); };
  const openDetailModal = (design: SavedDesign) => { setSelectedDesign(design); setShowDetailModal(true); };
  const calculateTotalPrice = (design: SavedDesign): number => { if (design.total_price) return design.total_price; if (design.design_data?.items) return design.design_data.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0); return 0; };
  const formatDate = (dateString: string) => dateString.split('T')[0];
  const getStatusColor = (status: string) => { switch (status.toUpperCase()) { case 'PAID': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'; case 'SHIPPED': return 'bg-green-500/20 text-green-400 border-green-500/50'; case 'DELIVERED': return 'bg-purple-500/20 text-purple-400 border-purple-500/50'; default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'; } };
  
  const handleAddressComplete = (data: { zonecode: string, address: string }) => { if (editForm) setEditForm({ ...editForm, zipcode: data.zonecode, address: data.address }); };
  const handleChangePassword = async () => { if (newPassword.length < 6) return alert('6자 이상 입력하세요.'); if (newPassword !== confirmPassword) return alert('일치하지 않습니다.'); try { const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) throw error; alert('변경되었습니다.'); setIsPasswordModalOpen(false); setNewPassword(''); setConfirmPassword(''); } catch (error: any) { alert(error.message); } };
  const handleUpdateProfile = async () => { if (!user || !editForm) return; try { const { error } = await supabase.from('profiles').update({ full_name: editForm.full_name, phone: editForm.phone, zipcode: editForm.zipcode, address: editForm.address, address_detail: editForm.address_detail, birthday: editForm.birthday, gender: editForm.gender, is_agreed_marketing: editForm.is_agreed_marketing }).eq('id', user.id); if (error) throw error; setProfile(editForm); alert('수정되었습니다.'); } catch (error: any) { alert(error.message); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, color: textColor }}>LOADING...</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-[var(--accent-color)] tracking-wider font-mono">MY DASHBOARD</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-1">
            <div className="p-6 rounded-lg border sticky top-24" style={{ ...borderStyle, backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-[var(--accent-color)]">ID CARD</h2><User className="opacity-50"/></div>
              <div className="space-y-4">
                <div><label className="text-xs opacity-50 block">Name</label><p className="font-bold">{profile?.full_name || 'User'}</p></div>
                <div><label className="text-xs opacity-50 block">Email</label><p className="text-sm opacity-80">{profile?.email}</p></div>
              </div>
              <button onClick={() => setActiveTab('SETTINGS')} className="w-full mt-6 bg-[var(--accent-color)] hover:brightness-95 text-black font-bold py-3 rounded transition"><Edit2 className="inline w-4 h-4 mr-2"/>EDIT PROFILE</button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="border rounded-lg overflow-hidden min-h-[600px]" style={borderStyle}>
              <div className="flex border-b" style={{ borderColor: borderStyle.borderColor }}>
                {(['ORDER_HISTORY', 'SAVED_DESIGNS', 'SETTINGS'] as TabType[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 font-bold text-sm tracking-wider transition-colors ${activeTab === tab ? 'bg-[var(--accent-color)] text-black' : 'hover:bg-white/5'}`} style={activeTab !== tab ? { color: textColor } : {}}>{tab.replace('_', ' ')}</button>
                ))}
              </div>
              <div className="p-6">
                
                {activeTab === 'ORDER_HISTORY' && (
                  <div className="space-y-6">{orders.length === 0 ? <div className="text-center py-12 opacity-50">No Orders</div> : orders.map(order => (<div key={order.id} className="border rounded-lg p-4 flex gap-4" style={borderStyle}><div className="w-32 h-32 bg-zinc-900 rounded overflow-hidden flex items-center justify-center">{order.custom_image_url ? <img src={order.custom_image_url} className="w-full h-full object-cover"/> : <Package className="text-gray-600"/>}</div><div><p className="font-bold">{formatDate(order.order_date)}</p><p className="text-[var(--accent-color)] font-bold">₩{order.total_price.toLocaleString()}</p><span className={`text-xs px-2 py-1 border rounded ${getStatusColor(order.status)}`}>{order.status}</span></div></div>))}</div>
                )}

                {activeTab === 'SAVED_DESIGNS' && (
                  <div>
                    {savedDesigns.length === 0 ? <div className="text-center py-12 opacity-50">No Designs</div> : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {savedDesigns.map((design) => (
                          // ✅ Saved Designs 카드 화이트 버전 (배경 흰색 고정)
                          <div key={design.id} className="bg-white border border-gray-200 hover:border-[var(--accent-color)] transition-all rounded-lg overflow-hidden group shadow-sm">
                            <div className="aspect-square bg-gray-50 relative cursor-pointer overflow-hidden border-b border-gray-100" onClick={() => openDetailModal(design)}>
                               <CanvasPreview items={design.design_data?.items || []} isThumbnail={true} canvasHeight={design.design_data?.canvasHeight || 700} />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20"><ZoomIn className="text-white w-10 h-10 drop-shadow-lg" /></div>
                            </div>
                            <div className="p-4">
                              <h4 className="font-bold text-gray-900 truncate mb-1">{design.design_name}</h4>
                              <p className="text-[var(--accent-color)] font-bold mb-4">₩{calculateTotalPrice(design).toLocaleString()}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleAddToCart(design)} className="bg-[var(--accent-color)] hover:brightness-95 text-black font-bold py-2 rounded text-xs flex items-center justify-center gap-1 transition"><ShoppingCart size={12}/> CART</button>
                                <button onClick={() => handleOrder(design)} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1"><CreditCard size={12}/> ORDER</button>
                                <button onClick={(e) => { e.stopPropagation(); handleShare(design); }} className="border border-gray-300 text-gray-500 font-bold py-2 rounded text-xs flex items-center justify-center gap-1 hover:bg-gray-50"><Share2 size={12}/> SHARE</button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteDesign(design.id); }} className="bg-red-50 text-red-500 border border-red-200 font-bold py-2 rounded text-xs flex items-center justify-center gap-1 hover:bg-red-100"><Trash2 size={12}/> DEL</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'SETTINGS' && editForm && (
                  <div className="max-w-2xl mx-auto space-y-6 py-4">
                    <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: borderStyle.borderColor }}>
                      <h3 className="text-xl font-bold">회원 정보 수정</h3>
                      <button onClick={() => setIsPasswordModalOpen(true)} className="text-sm border px-3 py-1.5 rounded flex items-center gap-1" style={{ ...borderStyle, color: textColor }}>비밀번호 변경</button>
                    </div>
                    <div className="space-y-4">
                      {/* 입력 폼 스타일 전역 연동 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm opacity-50 mb-1">아이디</label><input value={editForm.username || ''} disabled className="w-full bg-transparent border p-3 rounded opacity-50 cursor-not-allowed" style={borderStyle}/></div>
                        <div><label className="block text-sm opacity-50 mb-1">이메일</label><input value={editForm.email} disabled className="w-full bg-transparent border p-3 rounded opacity-50 cursor-not-allowed" style={borderStyle}/></div>
                      </div>
                      <div><label className="block text-sm opacity-50 mb-1">이름</label><input value={editForm.full_name || ''} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full bg-transparent border p-3 rounded outline-none focus:border-[var(--accent-color)]" style={{ ...borderStyle, color: textColor }}/></div>
                      <div><label className="block text-sm opacity-50 mb-1">휴대폰 번호</label><input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-transparent border p-3 rounded outline-none focus:border-[var(--accent-color)]" style={{ ...borderStyle, color: textColor }} placeholder="010-0000-0000"/></div>
                      <div>
                        <label className="block text-sm opacity-50 mb-1">주소</label>
                        <div className="flex gap-2 mb-2">
                          <input value={editForm.zipcode || ''} readOnly className="w-32 bg-transparent border p-3 rounded" style={{ ...borderStyle, color: textColor }} placeholder="우편번호"/>
                          <button onClick={() => setIsAddressModalOpen(true)} className="px-4 rounded text-sm font-bold flex items-center gap-2 bg-[var(--accent-color)] text-black">주소 검색</button>
                        </div>
                        <input value={editForm.address || ''} readOnly className="w-full bg-transparent border p-3 rounded mb-2" style={{ ...borderStyle, color: textColor }}/>
                        <input value={editForm.address_detail || ''} onChange={e => setEditForm({...editForm, address_detail: e.target.value})} className="w-full bg-transparent border p-3 rounded outline-none focus:border-[var(--accent-color)]" style={{ ...borderStyle, color: textColor }} placeholder="상세주소"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm opacity-50 mb-1">생년월일</label><input type="date" value={editForm.birthday || ''} onChange={e => setEditForm({...editForm, birthday: e.target.value})} className="w-full bg-transparent border p-3 rounded outline-none focus:border-[var(--accent-color)]" style={{ ...borderStyle, color: textColor }}/></div>
                        <div><label className="block text-sm opacity-50 mb-1">성별</label><div className="flex gap-4 py-3"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={editForm.gender === '남성'} onChange={() => setEditForm({...editForm, gender: '남성'})} className="accent-[var(--accent-color)]"/> 남성</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={editForm.gender === '여성'} onChange={() => setEditForm({...editForm, gender: '여성'})} className="accent-[var(--accent-color)]"/> 여성</label></div></div>
                      </div>
                      <label className="flex items-center gap-2 mt-4 cursor-pointer select-none"><input type="checkbox" checked={editForm.is_agreed_marketing || false} onChange={e => setEditForm({...editForm, is_agreed_marketing: e.target.checked})} className="w-5 h-5 accent-[var(--accent-color)]"/><span className="opacity-70">마케팅 정보 수신 동의 (이메일/문자)</span></label>
                    </div>
                    <div className="pt-6 flex justify-end"><button onClick={handleUpdateProfile} className="bg-[var(--accent-color)] hover:brightness-95 text-black font-bold py-3 px-8 rounded flex items-center gap-2 transition"><Save size={18}/> 저장하기</button></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 상세 모달 */}
      {showDetailModal && selectedDesign && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-gray-900 border-2 border-[var(--accent-color)] rounded-lg overflow-hidden w-full max-w-6xl max-h-[95vh] flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 bg-white flex items-center justify-center relative min-h-[500px]">
               <CanvasPreview items={selectedDesign.design_data?.items || []} isThumbnail={false} canvasHeight={selectedDesign.design_data?.canvasHeight || 700} />
            </div>
            <div className="w-full md:w-[400px] p-8 flex flex-col bg-gray-900 overflow-y-auto">
               <div className="flex justify-between items-start mb-6"><h3 className="text-2xl font-black text-white">{selectedDesign.design_name}</h3><button onClick={() => setShowDetailModal(false)}><X className="text-gray-400 hover:text-white"/></button></div>
               <div className="flex-1 mb-6"><h4 className="text-sm font-bold text-gray-500 mb-3">Components</h4><div className="space-y-2">{selectedDesign.design_data?.items?.map((item:any, i:number) => (<div key={i} className="flex items-center gap-3 bg-black/50 p-2 rounded"><img src={item.image} className="w-10 h-10 object-contain"/><span className="text-white text-sm font-bold flex-1 truncate">{item.name}</span><span className="text-[var(--accent-color)] font-bold">₩{(item.price||0).toLocaleString()}</span></div>))}</div></div>
               <div className="pt-4 border-t border-gray-700"><div className="flex justify-between items-end mb-4"><span className="text-gray-400 font-bold">TOTAL</span><span className="text-3xl font-black text-[var(--accent-color)]">₩{calculateTotalPrice(selectedDesign).toLocaleString()}</span></div><button onClick={() => handleAddToCart(selectedDesign)} className="w-full bg-[var(--accent-color)] hover:brightness-95 text-black font-black py-4 rounded text-lg mb-2 transition">ADD TO CART</button><button onClick={()=>handleOrder(selectedDesign)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded text-lg">ORDER NOW</button></div>
            </div>
          </div>
        </div>
      )}

      <AddressModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} onComplete={handleAddressComplete} />
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-white">비밀번호 변경</h3>
            <div className="space-y-4 mb-6"><div><label className="block text-sm text-gray-500 mb-1">새 비밀번호</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black border border-gray-600 p-3 rounded text-white focus:border-green-400 outline-none" placeholder="6자 이상 입력"/></div><div><label className="block text-sm text-gray-500 mb-1">새 비밀번호 확인</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-black border border-gray-600 p-3 rounded text-white focus:border-green-400 outline-none" placeholder="한 번 더 입력"/></div></div>
            <div className="flex gap-3"><button onClick={() => setIsPasswordModalOpen(false)} className="flex-1 bg-gray-800 text-white py-3 rounded hover:bg-gray-700">취소</button><button onClick={handleChangePassword} className="flex-1 bg-green-600 text-black font-bold py-3 rounded hover:bg-green-500">변경하기</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
