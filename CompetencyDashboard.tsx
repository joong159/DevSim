import React from 'react';
import { motion } from 'framer-motion';

export default function CompetencyDashboard() {
  // 시각화될 역량 데이터 (방사형 차트 대신 직관적이고 애니메이션이 유려한 프로그레스 바로 구현)
  const skills = [
    { name: '성실성', score: 85, color: 'bg-blue-500' },
    { name: 'CS 능력', score: 92, color: 'bg-green-500' },
    { name: '책임감', score: 78, color: 'bg-purple-500' },
    { name: '위기대처', score: 65, color: 'bg-yellow-500' },
  ];

  // 환산된 알바 경험 카드 데이터
  const experiences = [
    {
      title: '🍕 피자집 서빙 알바',
      duration: '6개월',
      badges: [
        { text: '성실성 +20pt', style: 'bg-blue-50 text-blue-600 border-blue-100' },
        { text: 'CS능력 +15pt', style: 'bg-green-50 text-green-600 border-green-100' }
      ]
    },
    {
      title: '🏪 편의점 야간 알바',
      duration: '3개월',
      badges: [
        { text: '책임감 +30pt', style: 'bg-purple-50 text-purple-600 border-purple-100' },
        { text: '위기대처 +10pt', style: 'bg-yellow-50 text-yellow-600 border-yellow-100' }
      ]
    }
  ];

  return (
    <section className="space-y-6 w-full">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">📊 내 알바 역량 분석</h2>
        
        {/* 역량 프로파일 (Framer Motion 애니메이션 적용) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-5">종합 역량 점수</h3>
          <div className="space-y-4">
            {skills.map((skill, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1.5 text-sm font-bold text-gray-700">
                  <span>{skill.name}</span>
                  <span className="text-gray-400">{skill.score}pt</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.score}%` }}
                    transition={{ duration: 1.2, delay: idx * 0.15, ease: "easeOut" }}
                    className={`h-full rounded-full ${skill.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 인증된 알바 경험 카드 (데이터 변환 뱃지 표시) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800">인증된 알바 경험</h3>
        <div className="grid grid-cols-1 gap-3">
          {experiences.map((exp, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + (idx * 0.2) }}
              className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-900">{exp.title}</span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">{exp.duration}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {exp.badges.map((badge, bIdx) => (
                  <span key={bIdx} className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badge.style}`}>
                    {badge.text}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}