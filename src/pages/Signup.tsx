import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { AddressModal } from '../components/AddressModal'; // ✅ 주소 모달 추가

declare global { interface Window { PortOne: any; } } // 포트원 타입 정의

export const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false); // 주소 모달 상태

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    username: '', 
    name: '',
    phone: '', // ✅ 번호 하나로 통합 관리 (하이픈 포함)
    zipcode: '', 
    address: '', 
    address_detail: '',
    birth_year: '2000', birth_month: '1', birth_day: '1',
    gender: 'M',
    agree_terms: false, agree_age: false, agree_marketing: false
  });

  // 입력값 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ✅ [기능 1] 주소 선택 완료 시 실행되는 함수
  const handleAddressComplete = (data: { zonecode: string, address: string }) => {
    setFormData(prev => ({
      ...prev,
      zipcode: data.zonecode,
      address: data.address
    }));
  };

  // ✅ [기능 2] 휴대폰 본인인증 (포트원)
  const handlePhoneAuth = async () => {
    try {
      const response = await window.PortOne.requestIdentityVerification({
        storeId: 'store-c0032e57-2292-494b-97e3-a49688d57d72', // 고객님 스토어 ID
        // identityVerificationId: '...', // 실제 계약시 필요 (테스트에선 자동)
      });

      if (response.code != null) {
        alert('인증에 실패했습니다: ' + response.message);
        return;
      }

      // 인증 성공 시 정보 자동 입력 (이름, 전화번호 등)
      // *주의: 실제로는 보안을 위해 서버에서 인증 정보를 조회해야 하지만, 프론트 단축 구현 예시입니다.
      alert('본인인증이 완료되었습니다!');
      
      // (선택) 인증된 정보를 폼에 자동 채우기
      if (response.customer) {
        setFormData(prev => ({
          ...prev,
          name: response.customer.fullName || prev.name,
          phone: response.customer.phoneNumber || prev.phone
        }));
      }
    } catch (error) {
      console.error(error);
      alert('본인인증 중 오류가 발생했습니다.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) return alert('비밀번호가 일치하지 않습니다.');
    if (!formData.agree_terms || !formData.agree_age) return alert('필수 약관에 동의해주세요.');

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.name } }
      });
      if (error) throw error;

      if (data.user) {
        const birthDate = `${formData.birth_year}-${formData.birth_month.padStart(2,'0')}-${formData.birth_day.padStart(2,'0')}`;
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username: formData.username,
            full_name: formData.name,
            phone: formData.phone,
            zipcode: formData.zipcode,
            address: formData.address,
            address_detail: formData.address_detail,
            birthday: birthDate,
            gender: formData.gender === 'M' ? '남성' : '여성',
            is_agreed_marketing: formData.agree_marketing,
            grade: '일반'
          })
          .eq('id', data.user.id);

        if (profileError) throw profileError;
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        navigate('/login');
      }
    } catch (error: any) {
      alert(`가입 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">회원가입</h2>
        <form onSubmit={handleSignup} className="space-y-5">
          {/* 아이디 & 이메일 */}
          <div className="grid gap-4">
            <div><label className="text-sm text-gray-400">아이디 *</label><input name="username" required onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 outline-none focus:border-cyan-400" /></div>
            <div><label className="text-sm text-gray-400">이메일 *</label><input type="email" name="email" required onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 outline-none focus:border-cyan-400" /></div>
          </div>

          {/* 비밀번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-400">비밀번호 *</label><input type="password" name="password" required onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 outline-none focus:border-cyan-400" placeholder="6자 이상" /></div>
            <div><label className="text-sm text-gray-400">비밀번호 확인 *</label><input type="password" name="passwordConfirm" required onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 outline-none focus:border-cyan-400" /></div>
          </div>

          {/* 이름 */}
          <div><label className="text-sm text-gray-400">이름 *</label><input name="name" required value={formData.name} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 outline-none focus:border-cyan-400" /></div>

          {/* ✅ 휴대폰 본인인증 적용 */}
          <div>
            <label className="text-sm text-gray-400">휴대폰 번호</label>
            <div className="flex gap-2">
              <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded p-3" 
                placeholder="'-' 없이 입력" 
              />
              <button 
                type="button" 
                onClick={handlePhoneAuth} 
                className="px-4 bg-zinc-800 border border-zinc-700 rounded text-sm hover:bg-zinc-700 text-cyan-400"
              >
                본인인증
              </button>
            </div>
          </div>

          {/* ✅ 주소 검색 적용 */}
          <div>
            <label className="text-sm text-gray-400">주소</label>
            <div className="flex gap-2 mb-2">
              <input name="zipcode" value={formData.zipcode} readOnly className="w-32 bg-zinc-900 border border-zinc-700 rounded p-3 text-gray-500" placeholder="우편번호" />
              <button 
                type="button" 
                onClick={() => setIsAddressOpen(true)} // 모달 열기
                className="px-4 bg-zinc-800 border border-zinc-700 rounded text-sm hover:bg-zinc-700"
              >
                주소 검색
              </button>
            </div>
            <input name="address" value={formData.address} readOnly className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 mb-2 text-gray-500" placeholder="기본 주소" />
            <input name="address_detail" onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 rounded p-3" placeholder="상세 주소" />
          </div>

          {/* 생년월일 & 성별 */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-400">생년월일</label><div className="flex gap-1"><select name="birth_year" onChange={handleChange} className="bg-zinc-900 border border-zinc-700 rounded p-3 flex-1">{Array.from({length: 60}, (_, i) => 2010 - i).map(y => <option key={y} value={y}>{y}</option>)}</select><select name="birth_month" onChange={handleChange} className="bg-zinc-900 border border-zinc-700 rounded p-3 w-16">{Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}</select><select name="birth_day" onChange={handleChange} className="bg-zinc-900 border border-zinc-700 rounded p-3 w-16">{Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}</select></div></div>
            <div><label className="text-sm text-gray-400">성별</label><div className="flex gap-4 py-3"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="M" checked={formData.gender === 'M'} onChange={handleChange} className="accent-cyan-400"/> 남자</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="F" checked={formData.gender === 'F'} onChange={handleChange} className="accent-cyan-400"/> 여자</label></div></div>
          </div>

          {/* 약관 */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="agree_terms" onChange={handleChange} className="w-5 h-5 accent-cyan-400" /><span>(필수) 이용약관 및 개인정보 수집 동의</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="agree_age" onChange={handleChange} className="w-5 h-5 accent-cyan-400" /><span>(필수) 만 14세 이상입니다.</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="agree_marketing" onChange={handleChange} className="w-5 h-5 accent-cyan-400" /><span>(선택) 마케팅 정보 수신 동의</span></label>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-cyan-400 text-black font-bold py-4 rounded hover:bg-cyan-300 disabled:opacity-50">{loading ? '가입 중...' : '가입하기'}</button>
          <div className="text-center text-sm text-gray-500">이미 계정이 있으신가요? <Link to="/login" className="text-cyan-400 hover:underline">로그인하기</Link></div>
        </form>
      </div>

      {/* ✅ 주소 검색 모달 */}
      <AddressModal 
        isOpen={isAddressOpen} 
        onClose={() => setIsAddressOpen(false)} 
        onComplete={handleAddressComplete} 
      />
    </div>
  );
};