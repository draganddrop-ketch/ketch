import { useState, useEffect } from 'react';
import { 
  Search, Download, Upload, Filter, ChevronRight, X, 
  Check, Truck, CreditCard, Package, User, FileText 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- 타입 정의 ---
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  options?: any;
}

interface Order {
  id: string;
  created_at: string; // Supabase 자동 생성 시간
  order_date?: string; // 기존 코드 호환
  merchant_uid: string;
  buyer_name: string;
  buyer_tel: string;
  buyer_addr: string;
  buyer_email?: string; // 추가됨
  total_price: number;
  status: string; // PAID, PREPARING, SHIPPED, DELIVERED, CANCELLED, RETURNED
  items: OrderItem[];
  tracking_number?: string;
  carrier?: string;
  admin_memo?: string;
}

// --- 엑셀 다운로드 헬퍼 ---
const downloadCSV = (orders: Order[], fields: string[]) => {
  const headers = fields.join(',');
  const rows = orders.map(order => {
    return fields.map(field => {
      let val: any = '';
      switch(field) {
        case '주문번호': val = order.merchant_uid; break;
        case '주문자': val = order.buyer_name; break;
        case '연락처': val = order.buyer_tel; break;
        case '주소': val = order.buyer_addr || '-'; break;
        case '상품명': val = order.items.map(i => `${i.name}(${i.quantity})`).join(' | '); break;
        case '결제금액': val = order.total_price; break;
        case '상태': val = order.status; break;
        case '송장번호': val = order.tracking_number || ''; break;
        default: val = '';
      }
      return `"${String(val).replace(/"/g, '""')}"`; // CSV 이스케이프 처리
    }).join(',');
  }).join('\n');

  const csvContent = `\uFEFF${headers}\n${rows}`; // BOM 추가 (한글 깨짐 방지)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
};

export const OrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('ALL'); // ALL, PAID, PREPARING, SHIPPED...
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // 모달 상태
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // 상세 보기 편집 상태
  const [editTracking, setEditTracking] = useState('');
  const [editCarrier, setEditCarrier] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editMemo, setEditMemo] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  // --- 필터링 로직 ---
  const filteredOrders = orders.filter(order => {
    const matchStatus = activeStatus === 'ALL' ? true : order.status === activeStatus;
    const matchSearch = 
      order.buyer_name?.includes(searchQuery) || 
      order.merchant_uid?.includes(searchQuery) ||
      (order.buyer_tel && order.buyer_tel.includes(searchQuery));
    return matchStatus && matchSearch;
  });

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PAID': return '결제 완료';
      case 'PREPARING': return '배송 준비';
      case 'SHIPPED': return '배송 중';
      case 'DELIVERED': return '배송 완료';
      case 'CANCELLED': return '취소';
      case 'RETURNED': return '반품';
      default: return status;
    }
  };

  const getStatusCount = (status: string) => {
    if (status === 'ALL') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  // --- 핸들러 ---
  const handleOpenDetail = (order: Order) => {
    setDetailOrder(order);
    setEditTracking(order.tracking_number || '');
    setEditCarrier(order.carrier || '');
    setEditStatus(order.status);
    setEditMemo(order.admin_memo || '');
  };

  const handleSaveDetail = async () => {
    if (!detailOrder) return;
    const { error } = await supabase
      .from('orders')
      .update({
        tracking_number: editTracking,
        carrier: editCarrier,
        status: editStatus,
        admin_memo: editMemo
      })
      .eq('id', detailOrder.id);

    if (!error) {
      alert('저장되었습니다.');
      setDetailOrder(null);
      fetchOrders(); // 목록 새로고침
    } else {
      alert('저장 실패');
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return alert('선택된 주문이 없습니다.');
    if (!confirm(`${selectedOrderIds.length}건의 상태를 변경하시겠습니까?`)) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .in('id', selectedOrderIds);

    if (!error) {
      alert('변경되었습니다.');
      fetchOrders();
      setSelectedOrderIds([]);
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      
      {/* 🔴 [좌측] 상태 필터 사이드바 (캡처 이미지 스타일) */}
      <div className="w-60 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-purple-600" size={18} /> 주문 관리
          </h2>
        </div>
        <div className="p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'ALL', label: '전체' },
            { id: 'PAID', label: '신규 주문 (결제완료)' },
            { id: 'PREPARING', label: '배송 준비' },
            { id: 'SHIPPED', label: '배송 중' },
            { id: 'DELIVERED', label: '배송 완료' },
            { id: 'CANCELLED', label: '취소 요청' },
            { id: 'RETURNED', label: '반품/교환' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveStatus(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeStatus === item.id 
                  ? 'bg-purple-50 text-purple-700 font-bold' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeStatus === item.id ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-500'}`}>
                {getStatusCount(item.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 🟢 [우측] 주문 목록 테이블 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 상단 툴바 */}
        <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <h1 className="text-xl font-bold text-gray-800">{getStatusLabel(activeStatus)}</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="주문자명, 번호 검색" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-purple-500" 
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInvoiceModal(true)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <Upload size={16} /> 송장 엑셀 등록
            </button>
            <button onClick={() => setShowExcelModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 flex items-center gap-2 shadow-sm">
              <Download size={16} /> 목록 엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* 선택 작업 바 */}
            {selectedOrderIds.length > 0 && (
              <div className="bg-purple-50 p-3 flex items-center gap-4 border-b border-purple-100 text-sm">
                <span className="font-bold text-purple-800">{selectedOrderIds.length}개 선택됨</span>
                <div className="h-4 w-px bg-purple-200"></div>
                <button onClick={() => handleBulkStatusChange('PREPARING')} className="hover:text-purple-700">배송 준비로 변경</button>
                <button onClick={() => handleBulkStatusChange('SHIPPED')} className="hover:text-purple-700">배송 중으로 변경</button>
              </div>
            )}

            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 w-10"><input type="checkbox" onChange={(e) => setSelectedOrderIds(e.target.checked ? filteredOrders.map(o => o.id) : [])} checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0} /></th>
                  <th className="py-3 px-4">주문번호 / 일시</th>
                  <th className="py-3 px-4">상품 정보</th>
                  <th className="py-3 px-4">주문자</th>
                  <th className="py-3 px-4 text-right">결제 금액</th>
                  <th className="py-3 px-4 text-center">상태</th>
                  <th className="py-3 px-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">주문 내역이 없습니다.</td></tr>
                ) : filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 group">
                    <td className="py-4 px-4"><input type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={() => toggleSelectOrder(order.id)} /></td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-800">{order.merchant_uid}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                          {order.items[0]?.image ? <img src={order.items[0].image} className="w-full h-full object-cover"/> : <Package size={20} className="m-auto text-gray-400"/>}
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 truncate max-w-[200px]">{order.items[0]?.name}</div>
                          {order.items.length > 1 && <div className="text-xs text-gray-400">외 {order.items.length - 1}건</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-800">{order.buyer_name}</div>
                      <div className="text-xs text-gray-400">{order.buyer_tel}</div>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-800">₩{order.total_price.toLocaleString()}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${order.status === 'PAID' ? 'bg-blue-100 text-blue-600' : 
                          order.status === 'PREPARING' ? 'bg-orange-100 text-orange-600' :
                          order.status === 'SHIPPED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button onClick={() => handleOpenDetail(order)} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-xs text-gray-600">상세</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🔵 주문 상세 모달 (스크린샷 UI 반영) */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">주문 상세 정보</h2>
                <p className="text-sm text-gray-500 mt-1">주문번호 {detailOrder.merchant_uid}</p>
              </div>
              <button onClick={() => setDetailOrder(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-8">
              
              {/* 1. 주문 상품 */}
              <section>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Package size={20}/> 주문 상품</h3>
                <div className="border rounded-lg divide-y">
                  {detailOrder.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded border overflow-hidden">
                        {item.image ? <img src={item.image} className="w-full h-full object-cover"/> : null}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">수량: {item.quantity}개</div>
                      </div>
                      <div className="font-bold">₩{item.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right text-xl font-bold text-gray-800">
                  총 결제금액: <span className="text-purple-600">₩{detailOrder.total_price.toLocaleString()}</span>
                </div>
              </section>

              {/* 2. 상태 및 배송 관리 */}
              <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Truck size={20}/> 배송 관리</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">주문 상태</label>
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="PAID">결제 완료</option>
                      <option value="PREPARING">배송 준비</option>
                      <option value="SHIPPED">배송 중</option>
                      <option value="DELIVERED">배송 완료</option>
                      <option value="CANCELLED">취소</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">택배사</label>
                    <select 
                      value={editCarrier} 
                      onChange={(e) => setEditCarrier(e.target.value)}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="">선택 안 함</option>
                      <option value="CJ대한통운">CJ대한통운</option>
                      <option value="우체국택배">우체국택배</option>
                      <option value="로젠택배">로젠택배</option>
                      <option value="롯데택배">롯데택배</option>
                      <option value="한진택배">한진택배</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1">송장번호</label>
                  <input 
                    type="text" 
                    value={editTracking} 
                    onChange={(e) => setEditTracking(e.target.value)}
                    placeholder="송장번호 입력"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">관리자 메모 (고객에게 안 보임)</label>
                  <textarea 
                    value={editMemo} 
                    onChange={(e) => setEditMemo(e.target.value)}
                    className="w-full p-2 border rounded h-20"
                    placeholder="특이사항 메모..."
                  />
                </div>
              </section>

              {/* 3. 주문자 정보 */}
              <section>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><User size={20}/> 배송지 정보</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-gray-500">받는 분</div>
                  <div className="font-medium">{detailOrder.buyer_name}</div>
                  
                  <div className="text-gray-500">연락처</div>
                  <div className="font-medium">{detailOrder.buyer_tel}</div>
                  
                  <div className="text-gray-500">주소</div>
                  <div className="col-span-2 font-medium bg-gray-50 p-2 rounded">{detailOrder.buyer_addr || '주소 정보 없음'}</div>
                </div>
              </section>

            </div>

            {/* 하단 고정 버튼 */}
            <div className="p-6 border-t border-gray-200 bg-white sticky bottom-0 flex justify-end gap-3">
              <button onClick={() => setDetailOrder(null)} className="px-6 py-3 bg-gray-100 rounded-lg font-bold text-gray-600">닫기</button>
              <button onClick={handleSaveDetail} className="px-6 py-3 bg-purple-600 rounded-lg font-bold text-white hover:bg-purple-700">변경사항 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 🟠 [모달] 엑셀 다운로드 */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">엑셀 내려받기</h3>
            <p className="text-gray-500 text-sm mb-6">현재 검색/필터된 {filteredOrders.length}건의 주문을 다운로드합니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExcelModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg text-gray-700 font-bold">취소</button>
              <button onClick={() => {
                downloadCSV(filteredOrders, ['주문번호', '주문자', '연락처', '상품명', '결제금액', '상태', '송장번호', '주소']);
                setShowExcelModal(false);
              }} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold">내려받기</button>
            </div>
          </div>
        </div>
      )}

      {/* 🟣 [모달] 송장 일괄 등록 (UI만 구현) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md text-center">
            <h3 className="text-xl font-bold mb-2">송장 엑셀 등록하기</h3>
            <p className="text-gray-500 text-sm mb-6">CSV 파일을 업로드하여 송장번호를 일괄 등록합니다.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 hover:bg-gray-50 cursor-pointer transition-colors">
              <FileText className="mx-auto text-gray-400 mb-2" size={32}/>
              <span className="text-sm text-gray-500">클릭하여 파일 업로드 (.csv)</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowInvoiceModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg text-gray-700 font-bold">취소하기</button>
              <button onClick={() => { alert('기능 준비 중입니다.'); setShowInvoiceModal(false); }} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold">등록하기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};