import { useEffect, useRef, useState } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon, 
  Video, Type, X 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showUrlInput, setShowUrlInput] = useState<{ type: 'link' | 'image' | 'video', value: string } | null>(null);

  // 외부에서 값이 바뀌면 에디터 내용 업데이트
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // 커서가 튀는 현상을 막기 위해 포커스가 없을 때만 업데이트하거나, 내용이 비었을 때 초기화
      if (value === '' || document.activeElement !== editorRef.current) {
         editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput(); // 변경 사항 즉시 반영
  };

  // --- 미디어 삽입 핸들러 ---
  const handleLink = () => {
    const url = prompt('링크 주소를 입력하세요 (https://...)');
    if (url) execCommand('createLink', url);
  };

  const handleImage = () => {
    const url = prompt('이미지 주소(URL)를 입력하세요');
    if (url) execCommand('insertImage', url);
  };

  const handleVideo = () => {
    const url = prompt('유튜브 등의 동영상 임베드 코드(<iframe>...) 또는 주소를 입력하세요');
    if (url) {
      // iframe 태그가 포함된 경우 그대로 삽입, 아니면 간단한 처리 (여기선 HTML 삽입 허용)
      if (url.includes('<iframe')) {
        execCommand('insertHTML', url);
      } else {
        // 단순 링크인 경우 비디오 태그로 변환 시도 (간소화)
        execCommand('insertHTML', `<p><a href="${url}" target="_blank">동영상 링크 보기</a></p>`);
      }
    }
  };

  const handleFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    if (size) execCommand('fontSize', size);
    e.target.value = ""; // 선택 초기화
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col h-full" style={{ minHeight: '300px' }}>
      {/* 툴바 영역 */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
        
        {/* 폰트 크기 선택 */}
        <div className="relative mr-2">
          <select 
            onChange={handleFontSize} 
            className="w-24 p-1 text-sm border border-gray-300 rounded focus:outline-none cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>Size</option>
            <option value="1">작게 (Small)</option>
            <option value="3">보통 (Normal)</option>
            <option value="5">크게 (Large)</option>
            <option value="7">아주 크게 (Huge)</option>
          </select>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* 기본 스타일 버튼 */}
        <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded" title="굵게"><Bold size={18} /></button>
        <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded" title="기울임"><Italic size={18} /></button>
        <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded" title="밑줄"><Underline size={18} /></button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* 정렬 버튼 */}
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-200 rounded" title="왼쪽 정렬"><AlignLeft size={18} /></button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-200 rounded" title="가운데 정렬"><AlignCenter size={18} /></button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-200 rounded" title="오른쪽 정렬"><AlignRight size={18} /></button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* 리스트 버튼 */}
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded" title="점 리스트"><List size={18} /></button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded" title="숫자 리스트"><ListOrdered size={18} /></button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* 미디어 첨부 버튼 */}
        <button type="button" onClick={handleLink} className="p-2 hover:bg-gray-200 rounded text-blue-600" title="링크 삽입"><LinkIcon size={18} /></button>
        <button type="button" onClick={handleImage} className="p-2 hover:bg-gray-200 rounded text-green-600" title="이미지 삽입"><ImageIcon size={18} /></button>
        <button type="button" onClick={handleVideo} className="p-2 hover:bg-gray-200 rounded text-red-600" title="동영상/HTML 삽입"><Video size={18} /></button>
      </div>

      {/* 에디터 본문 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-4 overflow-y-auto focus:outline-none min-h-[200px]"
        data-placeholder={placeholder}
        style={{
          wordBreak: 'break-word',
          lineHeight: '1.5'
        }}
      />
      
      {/* 플레이스홀더 스타일 */}
      <style>
        {`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            display: block; /* Firefox 대응 */
          }
          /* 이미지 크기 조절 등을 위한 기본 스타일 */
          [contenteditable] img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 4px 0;
          }
          [contenteditable] blockquote {
            border-left: 3px solid #ddd;
            padding-left: 10px;
            color: #666;
          }
        `}
      </style>
    </div>
  );
};