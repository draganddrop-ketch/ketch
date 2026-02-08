import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Header } from '../components/Header';
import { CanvasPreview } from '../components/CanvasPreview';
import { User, Package, Edit2, X, Trash2, ShoppingCart, CreditCard, Share2, ZoomIn, Save } from 'lucide-react';

// ✅ [수정] 프로필 데이터 타입 확장 (주소, 생일 등 추가)
interface UserProfile { 
  id: string; 
  email: string; 
  full_name: string | null; 
  created_at: string;
  username?: string; 
  phone?: string; 
  zipcode?: string; 
  address?: string; 
  address_detail?: string;
  birthday?: string; 
  gender?: string; 
  is_agreed_marketing?: boolean;
}

interface Order { id: string; order_date: string; status: string; total_price: number; custom_image_url: string | null; items: Array<{ id: string; name: string; price: number; quantity: number; }>; }
interface SavedDesign { id: string; design_name: string; snapshot_image: string; created_at: string; design_data: any; total_price?: number; }
type TabType = 'ORDER_HISTORY' | 'SAVED_DESIGNS' | 'SETTINGS';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('SAVED_DESIGNS');
  const [loading, setLoading] = useState(true);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);
  
  // ✅ [수정] 수정용 폼 데이터 상태
  const [editForm, setEditForm] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfileAndOrders();
  }, [user, navigate]);

  const fetchProfileAndOrders = async () => {
    if (!user) return;
    try {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const { data: ordersData } = await supabase.from('orders').select('*').eq('user_id', user.id).order('order_date', { ascending: false });
      const { data: designsData } = await supabase.from('saved_designs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      
      const userProfile: UserProfile = { 
        id: user.id, 
        email: user.email || '', 
        full_name: profileData?.full_name || null, 
        created_at: user.created_at || new Date().toISOString(),
        // 추가 정보 매핑
        username: profileData?.username,
        phone: profileData?.phone,
        zipcode: profileData?.zipcode,
        address: profileData?.address,
        address_detail: profileData?.address_detail,
        birthday: profileData?.birthday,
        gender: profileData?.gender,
        is_agreed_marketing: profileData?.is_agreed_marketing
      };
      
      setProfile(userProfile);
      setEditForm(userProfile); // 폼 초기값 설정
      setOrders(ordersData || []);
      setSavedDesigns(designsData || []);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  // ✅ [수정] 프로필 업데이트 핸들러 (상세 정보 저장)
  const handleUpdateProfile = async () => { 
    if (!user || !editForm) return; 
    try { 
      const { error } = await supabase.from('profiles').update({ 
        full_name: editForm.full_name,
        phone: editForm.phone,
        zipcode: editForm.zipcode,
        address: editForm.address,
        address_detail: editForm.address_detail,
        birthday: editForm.birthday,
        gender: editForm.gender,
        is_agreed_marketing: editForm.is_agreed_marketing
      }).eq('id', user.id); 
      
      if (error) throw error;
      
      setProfile(editForm); 
      alert('회원 정보가 성공적으로 수정되었습니다.');
    } catch (error: any) { 
      console.error(error); 
      alert('수정 실패: ' + error.message);
    } 
  };

  // 주소 검색 모의 함수 (실제 연동 시 다음 우편번호 API 등 사용)
  const handleAddressSearch = () => {
    if(!editForm) return;
    // 테스트용 값 입력 (실제 구현 시 우편번호 팝업 연동)
    setEditForm({...editForm, zipcode: '06236', address: '서울 강남구 테헤란로 123'});
  };

  const getStatusColor = (status: string) => { switch (status.toUpperCase()) { case 'PAID': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'; case 'SHIPPED': return 'bg-green-500/20 text-green-400 border-green-500/50'; case 'DELIVERED': return 'bg-purple-500/20 text-purple-400 border-purple-500/50'; default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'; } };
  const formatDate = (dateString: string) => dateString.split('T')[0];
  const handleDeleteDesign = async (designId: string) => { if (!confirm('Delete?')) return; try { await supabase.from('saved_designs').delete().eq('id', designId); setSavedDesigns(prev => prev.filter(d => d.id !== designId)); if (selectedDesign?.id === designId) { setShowDetailModal(false); setSelectedDesign(null); } } catch (error) { console.error(error); } };
  const calculateTotalPrice = (design: SavedDesign): number => { if (design.total_price) return design.total_price; if (design.design_data?.items) return design.design_data.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0); return 0; };
  const handleAddToCart = (design: SavedDesign) => { if (design.design_data?.items && design.design_data.items.length > 0) { const totalPrice = calculateTotalPrice(design); addToCart({ id: 'saved-design-' + design.id + '-' + Date.now(), name: design.design_name, price: totalPrice, image: '', items: design.design_data.items, canvasHeight: design.design_data?.canvasHeight }); alert('Added to cart!'); } else { alert('No items.'); } };
  const handleOrder = (design: SavedDesign) => { handleAddToCart(design); navigate('/cart'); };
  const handleShare = (design: SavedDesign) => { navigator.clipboard.writeText(`${window.location.origin}/design/${design.id}`).then(() => alert('Link copied!')).catch(() => alert('Failed')); };
  const openDetailModal = (design: SavedDesign) => { setSelectedDesign(design); setShowDetailModal(true); };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-400">LOADING...</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-green-400 tracking-wider">MY DASHBOARD</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 좌측 카드 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border-2 border-gray-700 p-6 rounded-lg sticky top-24">
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-green-400">ID CARD</h2><User className="text-green-400"/></div>
              <div className="space-y-4">
                <div><label className="text-xs text-gray-500">Name</label><p className="font-bold">{profile?.full_name || 'User'}</p></div>
                <div><label className="text-xs text-gray-500">ID</label><p className="text-sm text-gray-300">{profile?.username || '-'}</p></div>
                <div><label className="text-xs text-gray-500">Email</label><p className="text-sm text-gray-300">{profile?.email}</p></div>
              </div>
              <button onClick={() => setActiveTab('SETTINGS')} className="w-full mt-6 bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded"><Edit2 className="inline w-4 h-4 mr-2"/>EDIT PROFILE</button>
            </div>
          </div>

          {/* 우측 컨텐츠 */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden min-h-[600px]">
              <div className="flex border-b-2 border-gray-700">{(['ORDER_HISTORY', 'SAVED_DESIGNS', 'SETTINGS'] as TabType[]).map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 font-bold text-sm tracking-wider ${activeTab === tab ? 'bg-green-400 text-black' : 'bg-gray-800 text-gray-400'}`}>{tab.replace('_', ' ')}</button>))}</div>
              <div className="p-6">
                
                {activeTab === 'ORDER_HISTORY' && (
                  <div className="space-y-6">{orders.length === 0 ? <div className="text-center py-12 text-gray-500">No Orders</div> : orders.map(order => (<div key={order.id} className="bg-black border border-gray-700 rounded-lg p-4 flex gap-4"><div className="w-32 h-32 bg-gray-800 rounded overflow-hidden flex items-center justify-center">{order.custom_image_url ? <img src={order.custom_image_url} className="w-full h-full object-cover"/> : <Package className="text-gray-600"/>}</div><div><p className="font-bold">{formatDate(order.order_date)}</p><p className="text-green-400 font-bold">₩{order.total_price.toLocaleString()}</p><span className={`text-xs px-2 py-1 border rounded ${getStatusColor(order.status)}`}>{order.status}</span></div></div>))}</div>
                )}

                {activeTab === 'SAVED_DESIGNS' && (
                  <div>
                    {savedDesigns.length === 0 ? <div className="text-center py-12 text-gray-500">No Designs</div> : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {savedDesigns.map((design) => (
                          <div key={design.id} className="bg-black border border-gray-700 hover:border-green-400 transition-all rounded-lg overflow-hidden group">
                            <div className="aspect-square bg-zinc-900 relative cursor-pointer overflow-hidden" onClick={() => openDetailModal(design)}>
                               <CanvasPreview items={design.design_data?.items || []} isThumbnail={true} canvasHeight={design.design_data?.canvasHeight || 700} />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20"><ZoomIn className="text-white w-10 h-10" /></div>
                            </div>
                            <div className="p-4">
                              <h4 className="font-bold text-white truncate">{design.design_name}</h4>
                              <p className="text-green-400 font-bold">₩{calculateTotalPrice(design).toLocaleString()}</p>
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                <button onClick={() => handleAddToCart(design)} className="bg-green-600 hover:bg-green-500 text-black font-bold py-2 rounded text-xs flex items-center justify-center gap-1"><ShoppingCart size={12}/> CART</button>
                                <button onClick={() => handleOrder(design)} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2 rounded text-xs flex items-center justify-center gap-1"><CreditCard size={12}/> ORDER</button>
                                <button onClick={(e) => { e.stopPropagation(); handleShare(design); }} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1 border border-gray-600"><Share2 size={12}/> SHARE</button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteDesign(design.id); }} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1"><Trash2 size={12}/> DEL</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ [수정] 회원 정보 수정 폼 (SETTINGS 탭) */}
                {activeTab === 'SETTINGS' && editForm && (
                  <div className="max-w-2xl mx-auto space-y-6 py-4">
                    <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">회원 정보 수정</h3>
                    
                    <div className="space-y-4">
                      {/* 아이디 & 이메일 (수정 불가) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">아이디</label>
                          <input value={editForm.username || ''} disabled className="w-full bg-black border border-gray-700 p-3 rounded text-gray-500 cursor-not-allowed"/>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">이메일</label>
                          <input value={editForm.email} disabled className="w-full bg-black border border-gray-700 p-3 rounded text-gray-500 cursor-not-allowed"/>
                        </div>
                      </div>
                      
                      {/* 이름 */}
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">이름</label>
                        <input value={editForm.full_name || ''} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full bg-black border border-gray-600 p-3 rounded text-white focus:border-green-400 outline-none"/>
                      </div>
                      
                      {/* 휴대폰 번호 */}
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">휴대폰 번호</label>
                        <input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-black border border-gray-600 p-3 rounded text-white focus:border-green-400 outline-none" placeholder="010-0000-0000"/>
                      </div>
                      
                      {/* 주소 */}
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">주소</label>
                        <div className="flex gap-2 mb-2">
                          <input value={editForm.zipcode || ''} readOnly className="w-32 bg-black border border-gray-600 p-3 rounded text-white" placeholder="우편번호"/>
                          <button onClick={handleAddressSearch} className="px-4 bg-gray-700 rounded text-sm hover:bg-gray-600 font-bold">주소 검색</button>
                        </div>
                        <input value={editForm.address || ''} readOnly className="w-full bg-black border border-gray-600 p-3 rounded text-white mb-2"/>
                        <input value={editForm.address_detail || ''} onChange={e => setEditForm({...editForm, address_detail: e.target.value})} className="w-full bg-black border border-gray-600 p-3 rounded text-white focus:border-green-400 outline-none" placeholder="상세주소"/>
                      </div>

                      {/* 생일 & 성별 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">생년월일</label>
                          <input type="date" value={editForm.birthday || ''} onChange={e => setEditForm({...editForm, birthday: e.target.value})} className="w-full bg-black border border-gray-600 p-3 rounded text-white focus:border-green-400 outline-none"/>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">성별</label>
                          <div className="flex gap-4 py-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={editForm.gender === '남성'} onChange={() => setEditForm({...editForm, gender: '남성'})} className="accent-green-400"/> 남성
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={editForm.gender === '여성'} onChange={() => setEditForm({...editForm, gender: '여성'})} className="accent-green-400"/> 여성
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* 마케팅 동의 */}
                      <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                        <input type="checkbox" checked={editForm.is_agreed_marketing || false} onChange={e => setEditForm({...editForm, is_agreed_marketing: e.target.checked})} className="w-5 h-5 accent-green-400"/>
                        <span className="text-gray-400">마케팅 정보 수신 동의 (이메일/문자)</span>
                      </label>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button onClick={handleUpdateProfile} className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-8 rounded flex items-center gap-2">
                        <Save size={18}/> 저장하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 상세 모달 (기존 동일) */}
      {showDetailModal && selectedDesign && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-gray-900 border-2 border-green-400 rounded-lg overflow-hidden w-full max-w-6xl max-h-[95vh] flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 bg-zinc-950 flex items-center justify-center relative min-h-[500px] border-r border-gray-800">
               <CanvasPreview items={selectedDesign.design_data?.items || []} isThumbnail={false} canvasHeight={selectedDesign.design_data?.canvasHeight || 700} />
            </div>
            <div className="w-full md:w-[400px] p-8 flex flex-col bg-gray-900 overflow-y-auto">
               <div className="flex justify-between items-start mb-6"><h3 className="text-2xl font-black text-white">{selectedDesign.design_name}</h3><button onClick={() => setShowDetailModal(false)}><X className="text-gray-400 hover:text-white"/></button></div>
               <div className="flex-1 mb-6"><h4 className="text-sm font-bold text-gray-500 mb-3">Components</h4><div className="space-y-2">{selectedDesign.design_data?.items?.map((item:any, i:number) => (<div key={i} className="flex items-center gap-3 bg-black/50 p-2 rounded"><img src={item.image} className="w-10 h-10 object-contain"/><span className="text-white text-sm font-bold flex-1 truncate">{item.name}</span><span className="text-green-400 font-bold">₩{(item.price||0).toLocaleString()}</span></div>))}</div></div>
               <div className="pt-4 border-t border-gray-700"><div className="flex justify-between items-end mb-4"><span className="text-gray-400 font-bold">TOTAL</span><span className="text-3xl font-black text-green-400">₩{calculateTotalPrice(selectedDesign).toLocaleString()}</span></div><button onClick={() => handleAddToCart(selectedDesign)} className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded text-lg mb-2">ADD TO CART</button><button onClick={()=>handleOrder(selectedDesign)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded text-lg">ORDER NOW</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}