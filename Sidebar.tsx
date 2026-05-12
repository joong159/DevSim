import React from 'react';

export default function Sidebar() {
  const menuItems = [
    { name: '자유게시판', icon: '💬', active: false },
    { name: '실무 과제 퀘스트', icon: '🔥', active: true },
    { name: '내 역량 대시보드', icon: '📊', active: false },
    { name: '디지털 배지 보관함', icon: '🏅', active: false },
  ];

  return (
    <aside className="hidden md:block w-64 bg-transparent h-[calc(100vh-3.5rem)] sticky top-14 py-8 pr-6">
      <nav className="space-y-1.5">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${
              item.active 
                ? 'bg-white text-red-500 font-bold shadow-sm border border-gray-100' 
                : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent font-medium'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      
      <div className="mt-10 px-4">
        <div className="text-xs font-bold text-gray-400 mb-4">⭐ 즐겨찾는 직무</div>
        <ul className="space-y-3.5">
          <li className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-red-500 font-medium">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold">M</span>
            <span>콘텐츠 마케터</span>
          </li>
          <li className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-red-500 font-medium">
            <span className="w-6 h-6 rounded-md bg-green-50 text-green-500 flex items-center justify-center text-xs font-bold">D</span>
            <span>데이터 분석가</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}