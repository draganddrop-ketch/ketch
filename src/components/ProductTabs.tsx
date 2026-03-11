import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Image as ImageIcon, Lock, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { KeyringItem } from '../types';

type ReviewItem = {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  title?: string | null;
  content: string;
  images?: string[] | null;
  created_at: string;
  is_hidden?: boolean;
};

type QuestionItem = {
  id: string;
  product_id: string;
  user_id: string | null;
  title: string;
  content: string;
  is_secret?: boolean;
  status?: 'pending' | 'answered';
  answer_content?: string | null;
  created_at: string;
  is_hidden?: boolean;
};

type ReviewImage = { id: string; file: File; previewUrl: string };

type ProductTabsProps = {
  product: KeyringItem;
};

const maskUser = (value: string | null | undefined) => {
  if (!value) return '익명';
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${value.slice(0, 4)}***`;
};

const formatDate = (value: string) => {
  if (!value) return '';
  return value.split('T')[0];
};

const uploadImageToSupabase = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `public/reviews/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error } = await supabase.storage.from('product-images').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return data.publicUrl;
};

export const ProductTabs = ({ product }: ProductTabsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'qna'>('details');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingQna, setLoadingQna] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewImages, setReviewImages] = useState<ReviewImage[]>([]);
  const [reviewOnlyPhotos, setReviewOnlyPhotos] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [showQnaForm, setShowQnaForm] = useState(false);
  const [qnaTitle, setQnaTitle] = useState('');
  const [qnaContent, setQnaContent] = useState('');
  const [qnaSecret, setQnaSecret] = useState(false);
  const [isSubmittingQna, setIsSubmittingQna] = useState(false);

  useEffect(() => {
    if (!product?.id) return;
    fetchReviews();
    fetchQuestions();
  }, [product?.id]);

  useEffect(() => {
    let mounted = true;
    const fetchRole = async () => {
      if (!user) {
        if (mounted) setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase.from('profiles').select('role, email').eq('id', user.id).maybeSingle();
      if (mounted && !error) setIsAdmin((data?.role || 'user') === 'admin');
    };
    fetchRole();
    return () => {
      mounted = false;
    };
  }, [user]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    if (!error && data) setReviews(data as ReviewItem[]);
    setLoadingReviews(false);
  };

  const fetchQuestions = async () => {
    setLoadingQna(true);
    const { data, error } = await supabase
      .from('product_questions')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    if (!error && data) setQuestions(data as QuestionItem[]);
    setLoadingQna(false);
  };

  const reviewCount = reviews.length;
  const qnaCount = questions.length;
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const handleRequireLogin = () => {
    alert('로그인이 필요합니다.');
    navigate('/login');
  };

  const handleReviewImagesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: ReviewImage[] = Array.from(files).map((file) => ({
      id: `${Date.now()}_${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setReviewImages((prev) => [...prev, ...newItems]);
  };

  const removeReviewImage = (id: string) => {
    setReviewImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const submitReview = async () => {
    if (!user) return handleRequireLogin();
    if (!reviewContent.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const uploaded = await Promise.all(reviewImages.map((img) => uploadImageToSupabase(img.file)));
      const payload = {
        product_id: product.id,
        user_id: user.id,
        rating: reviewRating,
        title: reviewTitle || null,
        content: reviewContent,
        images: uploaded
      };
      const { error } = await supabase.from('product_reviews').insert(payload);
      if (error) throw error;
      setReviewTitle('');
      setReviewContent('');
      setReviewRating(5);
      reviewImages.forEach((img) => img.previewUrl.startsWith('blob:') && URL.revokeObjectURL(img.previewUrl));
      setReviewImages([]);
      setShowReviewForm(false);
      await fetchReviews();
    } catch (error: any) {
      alert(error.message || '리뷰 등록에 실패했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const submitQna = async () => {
    if (!user) return handleRequireLogin();
    if (!qnaTitle.trim() || !qnaContent.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    setIsSubmittingQna(true);
    try {
      const payload = {
        product_id: product.id,
        user_id: user.id,
        title: qnaTitle,
        content: qnaContent,
        is_secret: qnaSecret
      };
      const { error } = await supabase.from('product_questions').insert(payload);
      if (error) throw error;
      setQnaTitle('');
      setQnaContent('');
      setQnaSecret(false);
      setShowQnaForm(false);
      await fetchQuestions();
    } catch (error: any) {
      alert(error.message || '문의 등록에 실패했습니다.');
    } finally {
      setIsSubmittingQna(false);
    }
  };

  const filteredReviews = reviewOnlyPhotos
    ? reviews.filter((r) => (r.images || []).length > 0)
    : reviews;

  return (
    <div className="mt-12">
      <div className="border-b border-gray-200">
        <div className="grid grid-cols-3 text-center text-sm font-semibold">
          {([
            { key: 'details', label: '상세정보' },
            { key: 'reviews', label: `구매평 (${reviewCount})` },
            { key: 'qna', label: `Q&A (${qnaCount})` }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-black text-black' : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'details' && (
        <div className="py-10">
          {product.description ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : (
            <div className="text-sm text-gray-400">상세정보가 없습니다.</div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(averageRating) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <span className="text-sm font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({reviewCount})</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">상품을 구매하신 분들의 리뷰입니다.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input type="checkbox" checked={reviewOnlyPhotos} onChange={(e) => setReviewOnlyPhotos(e.target.checked)} />
                포토 구매평만 보기
              </label>
              <button
                type="button"
                onClick={() => (user ? setShowReviewForm((prev) => !prev) : handleRequireLogin())}
                className="px-4 py-2 text-xs border border-gray-300 rounded-full hover:bg-gray-50"
              >
                구매평 작성
              </button>
            </div>
          </div>

          {showReviewForm && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">별점</span>
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const score = i + 1;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setReviewRating(score)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star size={18} fill={score <= reviewRating ? 'currentColor' : 'none'} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="리뷰 제목 (선택)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="리뷰 내용을 입력해주세요."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-3 flex-wrap">
                {reviewImages.map((img) => (
                  <div key={img.id} className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden relative">
                    <img src={img.previewUrl} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeReviewImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs"
                    >
                      X
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 cursor-pointer">
                  <ImageIcon size={16} />
                  사진 추가
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleReviewImagesChange(e.target.files)} />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 text-xs border border-gray-300 rounded-full">
                  취소
                </button>
                <button type="button" onClick={submitReview} disabled={isSubmittingReview} className="px-4 py-2 text-xs bg-black text-white rounded-full">
                  {isSubmittingReview ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          )}

          {loadingReviews ? (
            <div className="text-sm text-gray-400">리뷰를 불러오는 중...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-sm text-gray-400">등록된 구매평이 없습니다.</div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{maskUser(review.user_id)}</span>
                    <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                  </div>
                  {review.title && <div className="text-sm font-semibold mt-2">{review.title}</div>}
                  <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">{review.content}</div>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {review.images.map((img, idx) => (
                        <img key={idx} src={img} className="w-20 h-20 object-cover rounded border border-gray-200" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'qna' && (
        <div className="py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">궁금한 점이 있다면 상품 문의를 남겨주세요.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (user ? setShowQnaForm((prev) => !prev) : handleRequireLogin())}
                className="px-4 py-2 text-xs border border-gray-300 rounded-full"
              >
                상품문의
              </button>
              <button
                type="button"
                onClick={() => alert('1:1 문의는 고객센터를 통해 진행해주세요.')}
                className="px-4 py-2 text-xs border border-gray-300 rounded-full"
              >
                1:1 문의
              </button>
            </div>
          </div>

          {showQnaForm && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <input
                value={qnaTitle}
                onChange={(e) => setQnaTitle(e.target.value)}
                placeholder="문의 제목"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={qnaContent}
                onChange={(e) => setQnaContent(e.target.value)}
                placeholder="문의 내용을 입력해주세요."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input type="checkbox" checked={qnaSecret} onChange={(e) => setQnaSecret(e.target.checked)} />
                비밀글로 작성
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowQnaForm(false)} className="px-4 py-2 text-xs border border-gray-300 rounded-full">
                  취소
                </button>
                <button type="button" onClick={submitQna} disabled={isSubmittingQna} className="px-4 py-2 text-xs bg-black text-white rounded-full">
                  {isSubmittingQna ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          )}

          {loadingQna ? (
            <div className="text-sm text-gray-400">문의글을 불러오는 중...</div>
          ) : questions.length === 0 ? (
            <div className="text-sm text-gray-400">등록된 문의가 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {questions.map((qna) => {
                const isOwner = user && qna.user_id === user.id;
                const canView = !qna.is_secret || isOwner || isAdmin;
                return (
                  <div key={qna.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {qna.is_secret && <Lock size={14} className="text-gray-400" />}
                        <span>{canView ? qna.title : '비밀글입니다.'}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(qna.created_at)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{maskUser(qna.user_id)}</div>
                    <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                      {canView ? qna.content : '비밀글 내용은 작성자와 관리자만 볼 수 있습니다.'}
                    </div>
                    {canView && qna.answer_content && (
                      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1">
                          <MessageSquare size={12} />
                          관리자 답변
                        </div>
                        <div className="text-gray-700 whitespace-pre-line">{qna.answer_content}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

