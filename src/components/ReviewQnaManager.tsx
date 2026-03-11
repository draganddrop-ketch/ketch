import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Trash2, EyeOff, Eye, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type ReviewItem = {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  title?: string | null;
  content: string;
  images?: string[] | null;
  is_hidden?: boolean;
  created_at: string;
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

type ProductMap = Record<string, string>;

const maskUser = (value: string | null | undefined) => {
  if (!value) return '익명';
  return `${value.slice(0, 4)}***`;
};

const formatDate = (value: string) => (value ? value.split('T')[0] : '');

export const ReviewQnaManager = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reviews' | 'qna'>('reviews');
  const [productsMap, setProductsMap] = useState<ProductMap>({});
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: productsData }, { data: reviewsData }, { data: questionsData }] = await Promise.all([
      supabase.from('products').select('id, name'),
      supabase.from('product_reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('product_questions').select('*').order('created_at', { ascending: false })
    ]);

    if (productsData) {
      const map: ProductMap = {};
      productsData.forEach((p: any) => {
        map[p.id] = p.name;
      });
      setProductsMap(map);
    }
    if (reviewsData) setReviews(reviewsData as ReviewItem[]);
    if (questionsData) setQuestions(questionsData as QuestionItem[]);
    setLoading(false);
  };

  const visibleReviews = useMemo(() => reviews, [reviews]);
  const visibleQuestions = useMemo(() => questions, [questions]);

  const toggleReviewHidden = async (review: ReviewItem) => {
    const { error } = await supabase.from('product_reviews').update({ is_hidden: !review.is_hidden }).eq('id', review.id);
    if (!error) fetchAll();
  };

  const deleteReview = async (review: ReviewItem) => {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('product_reviews').delete().eq('id', review.id);
    if (!error) fetchAll();
  };

  const toggleQuestionHidden = async (question: QuestionItem) => {
    const { error } = await supabase.from('product_questions').update({ is_hidden: !question.is_hidden }).eq('id', question.id);
    if (!error) fetchAll();
  };

  const deleteQuestion = async (question: QuestionItem) => {
    if (!confirm('문의글을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('product_questions').delete().eq('id', question.id);
    if (!error) fetchAll();
  };

  const saveAnswer = async (question: QuestionItem) => {
    const answer = answerDrafts[question.id] ?? question.answer_content ?? '';
    const { error } = await supabase
      .from('product_questions')
      .update({
        answer_content: answer,
        status: answer ? 'answered' : 'pending',
        answered_at: answer ? new Date().toISOString() : null,
        answered_by: answer ? user?.id || null : null
      })
      .eq('id', question.id);
    if (!error) fetchAll();
  };

  if (loading) return <div className="text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-sm rounded-full border ${activeTab === 'reviews' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600'}`}
        >
          리뷰 관리 ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('qna')}
          className={`px-4 py-2 text-sm rounded-full border ${activeTab === 'qna' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600'}`}
        >
          Q&A 관리 ({questions.length})
        </button>
      </div>

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {visibleReviews.length === 0 ? (
            <div className="text-sm text-gray-400">등록된 리뷰가 없습니다.</div>
          ) : (
            visibleReviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{productsMap[review.product_id] || '상품'}</div>
                  <div className="text-xs text-gray-400">{formatDate(review.created_at)}</div>
                </div>
                <div className="text-xs text-gray-500">작성자: {maskUser(review.user_id)}</div>
                <div className="text-sm text-gray-700">{review.title || '리뷰'}</div>
                <div className="text-sm text-gray-600 whitespace-pre-line">{review.content}</div>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.images.map((img, idx) => (
                      <img key={idx} src={img} className="w-16 h-16 object-cover rounded border border-gray-200" />
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => toggleReviewHidden(review)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded flex items-center gap-1"
                  >
                    {review.is_hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    {review.is_hidden ? '공개' : '숨김'}
                  </button>
                  <button
                    onClick={() => deleteReview(review)}
                    className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded flex items-center gap-1"
                  >
                    <Trash2 size={14} /> 삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'qna' && (
        <div className="space-y-4">
          {visibleQuestions.length === 0 ? (
            <div className="text-sm text-gray-400">등록된 문의가 없습니다.</div>
          ) : (
            visibleQuestions.map((qna) => (
              <div key={qna.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{productsMap[qna.product_id] || '상품'}</div>
                  <div className="text-xs text-gray-400">{formatDate(qna.created_at)}</div>
                </div>
                <div className="text-xs text-gray-500">작성자: {maskUser(qna.user_id)}</div>
                <div className="text-sm font-semibold">{qna.title}</div>
                <div className="text-sm text-gray-600 whitespace-pre-line">{qna.content}</div>
                <div className="text-xs text-gray-500">
                  상태: {qna.status === 'answered' ? '답변완료' : '대기'}
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MessageSquare size={14} />
                    답변
                  </div>
                  <textarea
                    rows={3}
                    value={answerDrafts[qna.id] ?? qna.answer_content ?? ''}
                    onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [qna.id]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="답변을 입력하세요."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveAnswer(qna)}
                      className="px-3 py-1.5 text-xs border border-emerald-200 text-emerald-700 rounded flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} />
                      답변 저장
                    </button>
                    <button
                      onClick={() => toggleQuestionHidden(qna)}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded flex items-center gap-1"
                    >
                      {qna.is_hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      {qna.is_hidden ? '공개' : '숨김'}
                    </button>
                    <button
                      onClick={() => deleteQuestion(qna)}
                      className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded flex items-center gap-1"
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

