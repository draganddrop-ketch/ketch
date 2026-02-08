import { useState, useEffect } from 'react';
import { Truck, Plus, X, Trash2, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

// 배송 정책 데이터 타입
interface ShippingPolicy {
  id: string;
  name: string;
  courier: string;
  memo: string;
  payment_type: 'PREPAID' | 'COD';
  scope: 'ALL' | 'INDIVIDUAL';
  calc_method: 'ONCE';
  base_cost: number;
  use_remote_cost: boolean;
  remote_cost: number;
  is_default: boolean;
}

export const ShippingManager = () => {
  const [policies, setPolicies] = useState<ShippingPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 모달 상태
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  
  // 묶음 배송 설정 상태
  const [useBundleShipping, setUseBundleShipping] = useState(true);

  // 폼 데이터
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ShippingPolicy>>({
    name: '', courier: '', memo: '', payment_type: 'PREPAID',
    scope: 'ALL', calc_method: 'ONCE', base_cost: 3000,
    use_remote_cost: false, remote_cost: 0, is_default: false
  });

  useEffect(() => {
    fetchPolicies();
    fetchBundleSetting();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shipping_policies')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (!error && data) setPolicies(data);
    setLoading(false);
  };

  const fetchBundleSetting = async () => {
    const { data } = await supabase.from('site_settings').select('use_bundle_shipping').eq('id', 1).maybeSingle();
    if (data) setUseBundleShipping(data.use_bundle_shipping);
  };

  const saveBundleSetting = async () => {
    await supabase.from('site_settings').update({ use_bundle_shipping: useBundleShipping }).eq('id', 1);
    setIsBundleModalOpen(false);
    alert('설정이 저장되었습니다.');
  };

  const handleOpenModal = (policy?: ShippingPolicy) => {
    if (policy) {
      setEditingId(policy.id);
      setFormData(policy);
    } else {
      setEditingId(null);
      setFormData({
        name: '', courier: '', memo: '', payment_type: 'PREPAID',
        scope: 'ALL', calc_method: 'ONCE', base_cost: 3000,
        use_remote_cost: false, remote_cost: 0, is_default: false
      });
    }
    setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!formData.name) return alert('정책 이름을 입력해주세요.');

    const payload = { ...formData };
    
    if (payload.is_default) {
      await supabase.from('shipping_policies').update({ is_default: false }).neq('id', 'placeholder');
    }

    if (editingId) {
      await supabase.from('shipping_policies').update(payload).eq('id', editingId);
    } else {
      await supabase.from('shipping_policies').insert(payload);
    }

    setIsPolicyModalOpen(false);
    fetchPolicies();
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await supabase.from('shipping_policies').delete().eq('id', id);
      fetchPolicies();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">배송 설정</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsBundleModalOpen(true)}
            className="px-5 py-2.5 bg-[#5c6ac4] text-white rounded-lg hover:bg-[#4f5bda] font-bold shadow-sm transition-colors"
          >
            배송비 묶음 설정하기
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 bg-[#5c6ac4] text-white rounded-lg hover:bg-[#4f5bda] font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            배송 정책 추가하기
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? <div className="text-center py-10 text-gray-500">불러오는 중...</div> : policies.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-xl text-gray-500">
            등록된 배송 정책이 없습니다. 정책을 추가해주세요.
          </div>
        ) : (
          policies.map((policy) => (
            <div key={policy.id} className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${policy.is_default ? 'bg-pink-100 text-pink-500' : 'bg-yellow-100 text-yellow-600'}`}>
                <Truck size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">{policy.name}</h3>
                  {policy.is_default && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">기본 정책</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {policy.scope === 'ALL' ? '동일 배송 정책을 가진 모든 상품' : '개별 상품'} <span className="text-gray-300 mx-1">|</span> 
                  {policy.payment_type === 'PREPAID' ? '선불' : '착불'} <span className="text-gray-300 mx-1">|</span> 
                  {policy.base_cost === 0 ? '무료' : `${policy.base_cost.toLocaleString()}원`}
                  {policy.use_remote_cost && ` (도서산간 +${policy.remote_cost.toLocaleString()}원)`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleOpenModal(policy)} className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-bold border border-gray-200 transition-colors">
                  설정하기
                </button>
                {!policy.is_default && (
                  <button onClick={() => handleDelete(policy.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 모달들은 코드 길이상 생략하지 않고 모두 포함합니다 */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? '배송 정책 수정' : '배송 정책 추가하기'}</h3>
              <button onClick={() => setIsPolicyModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">이름</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="예: 기본 배송비" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">택배회사</label>
                <select value={formData.courier} onChange={e => setFormData({...formData, courier: e.target.value})} className="w-full border rounded-lg px-4 py-3 outline-none bg-white">
                  <option value="">택배회사를 선택해주세요.</option>
                  <option value="CJ대한통운">CJ대한통운</option>
                  <option value="우체국택배">우체국택배</option>
                  <option value="로젠택배">로젠택배</option>
                  <option value="한진택배">한진택배</option>
                  <option value="롯데택배">롯데택배</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">배송 메모</label>
                <input type="text" value={formData.memo} onChange={e => setFormData({...formData, memo: e.target.value})} className="w-full border rounded-lg px-4 py-3 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">배송비 청구 방식</label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 justify-center ${formData.payment_type === 'PREPAID' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="payment_type" checked={formData.payment_type === 'PREPAID'} onChange={() => setFormData({...formData, payment_type: 'PREPAID'})} className="hidden"/>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.payment_type === 'PREPAID' ? 'border-indigo-600' : 'border-gray-300'}`}>{formData.payment_type === 'PREPAID' && <div className="w-2 h-2 bg-indigo-600 rounded-full"/>}</div>
                    <span className="font-bold">선불</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 justify-center ${formData.payment_type === 'COD' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="payment_type" checked={formData.payment_type === 'COD'} onChange={() => setFormData({...formData, payment_type: 'COD'})} className="hidden"/>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.payment_type === 'COD' ? 'border-indigo-600' : 'border-gray-300'}`}>{formData.payment_type === 'COD' && <div className="w-2 h-2 bg-indigo-600 rounded-full"/>}</div>
                    <span className="font-bold">착불</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">기본 배송비</label>
                <div className="relative">
                  <input type="number" value={formData.base_cost} onChange={e => setFormData({...formData, base_cost: Number(e.target.value)})} className="w-full border rounded-lg pl-4 pr-10 py-3 text-right outline-none font-bold text-gray-700" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">도서 산간 지역 추가 배송비</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={formData.use_remote_cost === true} onChange={() => setFormData({...formData, use_remote_cost: true})} className="accent-indigo-600 w-4 h-4"/> <span className="text-gray-700">사용</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={formData.use_remote_cost === false} onChange={() => setFormData({...formData, use_remote_cost: false})} className="accent-indigo-600 w-4 h-4"/> <span className="text-gray-700">사용 안 함</span></label>
                </div>
                {formData.use_remote_cost && (
                  <div className="relative animate-fade-in">
                    <input type="number" value={formData.remote_cost} onChange={e => setFormData({...formData, remote_cost: Number(e.target.value)})} className="w-full border rounded-lg pl-4 pr-10 py-3 text-right outline-none" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <input type="checkbox" id="default_chk" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                <label htmlFor="default_chk" className="text-sm font-medium text-gray-700 cursor-pointer">이 정책을 기본 배송 정책으로 설정</label>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button onClick={() => setIsPolicyModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors">취소하기</button>
              <button onClick={handleSavePolicy} className="flex-1 py-3 bg-[#5c6ac4] text-white rounded-lg font-bold hover:bg-[#4f5bda] transition-colors">{editingId ? '수정하기' : '추가하기'}</button>
            </div>
          </div>
        </div>
      )}

      {isBundleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">배송비 묶음 설정하기</h3>
              <button onClick={() => setIsBundleModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-800 mb-4">사용 여부</label>
              <div className="flex gap-4">
                <label className={`flex-1 border rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer transition-all ${useBundleShipping ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${useBundleShipping ? 'border-indigo-600' : 'border-gray-300'}`}>{useBundleShipping && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"/>}</div>
                  <span className="font-bold">사용</span>
                </label>
                <label className={`flex-1 border rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer transition-all ${!useBundleShipping ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!useBundleShipping ? 'border-indigo-600' : 'border-gray-300'}`}>{!useBundleShipping && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"/>}</div>
                  <span className="font-bold">사용 안 함</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                '사용' 선택 시, 장바구니에 담긴 상품 중 <br/>가장 비싼 배송비 1회만 부과됩니다.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsBundleModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">취소하기</button>
              <button onClick={saveBundleSetting} className="flex-1 py-3 bg-[#5c6ac4] text-white rounded-lg font-bold hover:bg-[#4f5bda]">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};