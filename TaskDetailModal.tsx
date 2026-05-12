import React from 'react';

export interface Task {
  title: string;
  category: string;
  deadline: string;
  description: string;
  requirements: string[];
  reward: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  // 배경(Backdrop) 클릭 시 모달 닫힘 처리
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* 닫기 버튼 */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors p-1"
          aria-label="닫기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 모달 콘텐츠 */}
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-5 pr-8">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${task.category === '마케팅' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
              {task.category}
            </span>
            <span className="text-red-500 text-sm font-semibold">{task.deadline}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">{task.title}</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">📝 과제 상세 설명</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">✅ 지원 자격 및 우대사항</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5">
                {task.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-1">🎁 완료 보상</h3>
              <p className="text-sm text-red-500 font-semibold">{task.reward}</p>
            </div>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="mt-8">
            <button className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 transition-colors shadow-sm">
              이 과제 지원하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}