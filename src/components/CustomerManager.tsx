import { useState, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string; email: string; full_name: string; username: string; phone: string;
  grade: string; created_at: string; zipcode: string; address: string; address_detail: string;
  birthday: string; gender: string; is_agreed_marketing: boolean; memo: string;
}

export const CustomerManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = (c.full_name?.includes(searchQuery)) || (c.email?.includes(searchQuery)) || (c.phone?.includes(searchQuery));
    const matchesTab = activeTab === 'ALL' ? true : c.grade === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleUpdateCustomer = async (id: string, updates: any) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (!error) {
      alert('저장되었습니다.');
      fetchCustomers();
      if(selectedCustomer) setSelectedCustomer({...selectedCustomer, ...updates});
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="w-60 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-gray-800 flex items-center gap-2"><User className="text-blue-600" size={18} /> 고객 관리</h2></div>
        <div className="p-3 space-y-1">
          {['ALL', '일반', '실버', '골드'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-3 py-2 rounded ${activeTab === tab ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{tab === 'ALL' ? '전체' : tab} <span className="float-right bg-gray-100 px-2 rounded-full text-xs text-gray-500">{tab === 'ALL' ? customers.length : customers.filter(c => c.grade === tab).length}</span></button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center">
          <div className="flex gap-3 items-center"><h1 className="text-xl font-bold text-gray-800">전체 고객</h1><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="이름, 아이디, 휴대폰 검색" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-blue-500" /></div></div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">전체 목록 내려받기</button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200"><tr><th className="py-3 px-4">이름</th><th className="py-3 px-4">아이디</th><th className="py-3 px-4">이메일</th><th className="py-3 px-4">휴대폰 번호</th><th className="py-3 px-4">등급</th><th className="py-3 px-4">가입일</th><th className="py-3 px-4">관리</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{filteredCustomers.map(customer => (<tr key={customer.id} className="hover:bg-gray-50"><td className="py-4 px-4 font-bold text-gray-800">{customer.full_name}</td><td className="py-4 px-4 text-gray-600">{customer.username || '-'}</td><td className="py-4 px-4 text-gray-600">{customer.email}</td><td className="py-4 px-4 text-gray-600">{customer.phone || '-'}</td><td className="py-4 px-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{customer.grade || '일반'}</span></td><td className="py-4 px-4 text-gray-500">{customer.created_at?.split('T')[0]}</td><td className="py-4 px-4"><button onClick={() => setSelectedCustomer(customer)} className="text-blue-600 hover:underline">상세</button></td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto p-8 animate-slide-in-right">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.full_name}님의 정보</h2><button onClick={() => setSelectedCustomer(null)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button></div>
            <div className="space-y-8">
              <section><h3 className="font-bold text-lg mb-4 border-b pb-2">기본 정보</h3><div className="grid grid-cols-3 gap-y-4 text-sm"><div className="text-gray-500">가입일</div><div className="col-span-2">{selectedCustomer.created_at.replace('T', ' ').slice(0,19)}</div><div className="text-gray-500">아이디</div><div className="col-span-2">{selectedCustomer.username}</div><div className="text-gray-500">이메일</div><div className="col-span-2">{selectedCustomer.email}</div><div className="text-gray-500">이름</div><div className="col-span-2">{selectedCustomer.full_name}</div><div className="text-gray-500">휴대폰</div><div className="col-span-2">{selectedCustomer.phone}</div><div className="text-gray-500">주소</div><div className="col-span-2">({selectedCustomer.zipcode}) {selectedCustomer.address} {selectedCustomer.address_detail}</div><div className="text-gray-500">생년월일</div><div className="col-span-2">{selectedCustomer.birthday}</div><div className="text-gray-500">성별</div><div className="col-span-2">{selectedCustomer.gender}</div><div className="text-gray-500">마케팅 동의</div><div className="col-span-2">{selectedCustomer.is_agreed_marketing ? '동의함' : '동의안함'}</div></div></section>
              <section><h3 className="font-bold text-lg mb-4 border-b pb-2">활동 정보</h3><div className="grid grid-cols-3 gap-y-4 text-sm items-center"><div className="text-gray-500">등급</div><div className="col-span-2"><select value={selectedCustomer.grade || '일반'} onChange={(e) => handleUpdateCustomer(selectedCustomer.id, { grade: e.target.value })} className="border rounded p-2"><option value="일반">일반</option><option value="실버">실버</option><option value="골드">골드</option></select></div><div className="text-gray-500">관리자 메모</div><div className="col-span-2"><textarea className="w-full border rounded p-2 h-24" value={selectedCustomer.memo || ''} onChange={(e) => setSelectedCustomer({...selectedCustomer, memo: e.target.value})} onBlur={(e) => handleUpdateCustomer(selectedCustomer.id, { memo: e.target.value })} placeholder="고객 특이사항 메모 (자동저장)"/></div></div></section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};