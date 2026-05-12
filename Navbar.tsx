import React from 'react';

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#f2f2f2] z-40 flex items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-7xl flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-red-500 cursor-pointer tracking-tight">Skillit</h1>
        
        <div className="flex items-center space-x-5">
          <button className="text-gray-400 hover:text-red-500 transition-colors" aria-label="알림">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm shadow-sm hover:ring-2 hover:ring-red-100 transition-all">
            🎓
          </button>
        </div>
      </div>
    </header>
  );
}