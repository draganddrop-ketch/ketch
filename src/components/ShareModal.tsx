import { useMemo } from 'react';
import { X, Share2, Copy } from 'lucide-react';

declare global {
  interface Window {
    Kakao?: any;
  }
}

let kakaoSdkPromise: Promise<any> | null = null;

const loadKakaoSdk = (appKey: string) => {
  if (!appKey) return Promise.reject(new Error('Missing Kakao app key'));
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Kakao) {
    if (typeof window.Kakao.isInitialized === 'function' && !window.Kakao.isInitialized()) {
      window.Kakao.init(appKey);
    }
    return Promise.resolve(window.Kakao);
  }

  if (!kakaoSdkPromise) {
    kakaoSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      script.async = true;
      script.setAttribute('data-kakao-sdk', 'true');
      script.onload = () => {
        if (window.Kakao) {
          if (typeof window.Kakao.isInitialized === 'function' && !window.Kakao.isInitialized()) {
            window.Kakao.init(appKey);
          }
          resolve(window.Kakao);
        } else {
          reject(new Error('Kakao SDK load failed'));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return kakaoSdkPromise;
};

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  image?: string;
  url?: string;
  kakaoKey?: string | null;
}

export const ShareModal = ({ open, onClose, title, description, image, url, kakaoKey }: ShareModalProps) => {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || '';
  const shareDescription = (description || '').trim();
  const shareImage = image || (typeof window !== 'undefined' ? `${window.location.origin}/vite.svg` : '');
  const canSystemShare = typeof navigator !== 'undefined' && !!navigator.share;

  const shareTargets = useMemo(() => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedText = encodeURIComponent(`${shareTitle} ${shareUrl}`.trim());

    return [
      {
        id: 'kakao',
        label: '카카오톡',
        bg: '#FEE500',
        color: '#1d1d1d',
        onClick: async () => {
          if (!kakaoKey) {
            alert('카카오톡 공유를 사용하려면 상점 설정에서 JavaScript 키를 입력해주세요.');
            return;
          }
          try {
            const Kakao = await loadKakaoSdk(kakaoKey);
            Kakao.Share.sendDefault({
              objectType: 'feed',
              content: {
                title: shareTitle,
                description: shareDescription || shareTitle,
                imageUrl: shareImage,
                link: { webUrl: shareUrl, mobileWebUrl: shareUrl },
              },
              buttons: [
                { title: '상품 보러가기', link: { webUrl: shareUrl, mobileWebUrl: shareUrl } }
              ],
            });
          } catch (err) {
            console.error(err);
            alert('카카오 공유를 실행할 수 없습니다. 설정을 확인해주세요.');
          }
        }
      },
      {
        id: 'line',
        label: '라인',
        bg: '#00c300',
        color: '#ffffff',
        url: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`
      },
      {
        id: 'band',
        label: '밴드',
        bg: '#00c73c',
        color: '#ffffff',
        url: `https://band.us/plugin/share?body=${encodedText}&route=${encodedUrl}`
      },
      {
        id: 'naver',
        label: '네이버',
        bg: '#03c75a',
        color: '#ffffff',
        url: `https://share.naver.com/web/shareView?url=${encodedUrl}&title=${encodedTitle}`
      },
      {
        id: 'facebook',
        label: '페이스북',
        bg: '#1877f2',
        color: '#ffffff',
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      },
      {
        id: 'x',
        label: 'X',
        bg: '#111111',
        color: '#ffffff',
        url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
      },
    ];
  }, [shareUrl, shareTitle, shareDescription, shareImage, kakaoKey]);

  if (!open) return null;

  const handleCopyLink = async () => {
    try {
      if (!navigator?.clipboard) {
        window.prompt('아래 링크를 복사하세요.', shareUrl);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 복사되었습니다.');
    } catch (err) {
      console.error(err);
      window.prompt('아래 링크를 복사하세요.', shareUrl);
    }
  };

  const handleSystemShare = async () => {
    if (!navigator?.share) return;
    try {
      await navigator.share({ title: shareTitle, text: shareDescription, url: shareUrl });
    } catch (err) {
      console.error(err);
    }
  };

  const openShareWindow = (targetUrl: string) => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer,width=640,height=720');
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Share2 size={18} /> 공유하기
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {canSystemShare && (
            <button
              onClick={handleSystemShare}
              className="w-full py-3 rounded-lg bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition"
            >
              기기 공유 메뉴 열기
            </button>
          )}

          <div className="grid grid-cols-3 gap-4">
            {shareTargets.map(target => (
              <button
                key={target.id}
                onClick={() => (target.url ? openShareWindow(target.url) : target.onClick?.())}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold shadow"
                  style={{ backgroundColor: target.bg, color: target.color }}
                >
                  {target.label[0]}
                </div>
                <span className="text-xs text-gray-600">{target.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 text-xs text-gray-600 bg-transparent outline-none"
            />
            <button onClick={handleCopyLink} className="px-3 py-2 text-xs font-semibold rounded-md bg-gray-900 text-white flex items-center gap-1">
              <Copy size={14} /> 복사
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
