import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Cpu,
  Activity,
  Info,
  Settings,
  Code,
  Terminal,
  Palette,
  Database,
  MessageSquare,
  History,
  X,
  RotateCcw,
  Key,
  Save,
  CheckCircle,
  FileText,
  ImageIcon,
  Play,
  Loader2,
  Video
} from 'lucide-react';

// 초기 NPC 데이터 구성 (특기 및 미디어 역할군 부여)
const initialNPCs = [
  { id: 1, name: '박팀장', role: 'Project Manager', specialty: 'text', x: 20, y: 30, color: 'bg-blue-500', icon: FileText, status: '프로젝트 기획안 작성 중' },
  { id: 2, name: '김개발', role: 'Software Engineer', specialty: 'code', x: 60, y: 25, color: 'bg-green-500', icon: Code, status: '핵심 로직 구현 중' },
  { id: 3, name: '이픽셀', role: 'UI/UX Designer', specialty: 'image', x: 75, y: 65, color: 'bg-purple-500', icon: Palette, status: '브랜드 로고 디자인 구상 중' },
  { id: 4, name: '강무비', role: 'Video Creator', specialty: 'video', x: 30, y: 70, color: 'bg-rose-500', icon: Video, status: '홍보 영상 렌더링 준비 중' },
];

// 무작위로 변경될 상태 메시지 목록
const statusMessages = [
  '코드 리뷰 진행 중 🧐',
  '잠시 커피 브레이크 ☕',
  '치명적인 버그 헌팅 🐛',
  '개발 문서 업데이트 중 📝',
  '동료와 기술 논의 중 🗣️',
  '서버 로그 분석 중 📊',
  '유닛 테스트 코드 작성 ✅',
  '스택오버플로우 검색 중 🔍',
  '프로젝트 빌드 대기 중 ⏳',
  '새로운 기능 구상 중 💡',
  '이미지 에셋 서칭 중 🖼️',
  '영상 트랜지션 효과 적용 🎬'
];

// 각 NPC별 업무 코드 스니펫 (더블클릭 시 표시)
const codeSnippets = {
  1: `import React from 'react';\nimport { Button } from '@/components/ui';\n\nexport default function LandingPage() {\n  return (\n    <div className="min-h-screen bg-slate-900 flex items-center justify-center">\n      <h1 className="text-5xl font-bold text-white mb-6">Welcome to DevSim!</h1>\n      <Button variant="primary" size="lg">Get Started</Button>\n    </div>\n  );\n}`,
  2: `const express = require('express');\nconst router = express.Router();\nconst { verifyToken } = require('../middlewares/auth');\n\nrouter.post('/login', async (req, res) => {\n  try {\n    const { email, password } = req.body;\n    // FIXME: 인증 토큰 검증 로직 버그 수정 중\n    const token = await authenticateUser(email, password);\n    res.status(200).json({ token });\n  } catch (error) {\n    res.status(401).json({ error: 'Unauthorized' });\n  }\n});`,
  3: `name: Staging Deployment\n\non:\n  push:\n    branches: [ "main" ]\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - name: Setup Node.js\n        uses: actions/setup-node@v3\n        with:\n          node-version: '18'\n      - name: Install dependencies\n        run: npm ci\n      - name: Build & Deploy\n        run: |\n          npm run build\n          ./deploy-staging.sh`,
  4: `.glass-panel {\n  background: rgba(255, 255, 255, 0.05);\n  backdrop-filter: blur(10px);\n  -webkit-backdrop-filter: blur(10px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 16px;\n  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);\n}\n\n.btn-primary:hover {\n  transform: translateY(-2px);\n  transition: all 0.2s ease-in-out;\n}`
};

export default function DevSim() {
  const [selectedId, setSelectedId] = useState(null);
  const [npcs, setNpcs] = useState(initialNPCs);
  const [draggingId, setDraggingId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [editingNpcId, setEditingNpcId] = useState(null);
  
  // 멀티모달 확장 기능 State
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeys, setApiKeys] = useState({ llm: '', image: '', video: '', audio: '' });
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [mediaOutputs, setMediaOutputs] = useState({});
  const [generatingMessage, setGeneratingMessage] = useState('');
  const [viewingImage, setViewingImage] = useState(null);

  const officeRef = useRef(null);
  const draggingIdRef = useRef(null);
  const prevNpcsRef = useRef(initialNPCs);
  const shoutTimeoutRef = useRef(null);

  // 로컬 스토리지에서 API 키 불러오기
  useEffect(() => {
    const savedKeys = localStorage.getItem('devsim_keys');
    if (savedKeys) setApiKeys(JSON.parse(savedKeys));
  }, []);

  // API 키 저장 핸들러
  const handleSaveKeys = () => {
    localStorage.setItem('devsim_keys', JSON.stringify(apiKeys));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  // NPC 상태 변화 감지 및 활동 로그 기록
  useEffect(() => {
    const newLogs = [];
    npcs.forEach((npc) => {
      const prevNpc = prevNpcsRef.current.find((n) => n.id === npc.id);
      if (prevNpc && prevNpc.status !== npc.status) {
        newLogs.push({
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          name: npc.name,
          npcId: npc.id,
          status: npc.status,
          color: npc.color,
        });
      }
    });

    if (newLogs.length > 0) {
      setLogs((prev) => [...newLogs, ...prev].slice(0, 50)); // 최신 로그 50개 유지 (최신순)
    }
    prevNpcsRef.current = npcs;
  }, [npcs]);

  // 무작위 이동을 위한 Effect Hook
  useEffect(() => {
    const interval = setInterval(() => {
      setNpcs((currentNpcs) =>
        currentNpcs.map((npc) => {
          // 드래그 중인 NPC는 자동 이동 스킵
          if (npc.id === draggingIdRef.current) return npc;

          // -10% ~ +10% 범위 내에서 무작위 이동 좌표 생성
          const dx = (Math.random() - 0.5) * 20;
          const dy = (Math.random() - 0.5) * 20;
          
          // 오피스 밖을 벗어나지 않도록 좌표 보정 (10% ~ 90%)
          const newX = Math.max(10, Math.min(90, npc.x + dx));
          const newY = Math.max(10, Math.min(90, npc.y + dy));
          
          // 무작위 상태 선택
          const newStatus = statusMessages[Math.floor(Math.random() * statusMessages.length)];
          
          return { ...npc, x: newX, y: newY, status: newStatus };
        })
      );
    }, 3000); // 3초 간격으로 위치 업데이트

    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (shoutTimeoutRef.current) clearTimeout(shoutTimeoutRef.current);
    setNpcs(initialNPCs);
    setLogs([]);
    setSelectedId(null);
    setEditingNpcId(null);
    setDraggingId(null);
    draggingIdRef.current = null;
    prevNpcsRef.current = initialNPCs;
    setGeneratingId(null);
    setMediaOutputs({});
    setGeneratingMessage('');
  };

  // 선택된 NPC 찾기
  const selectedNPC = npcs.find(npc => npc.id === selectedId);

  // 미디어 생성 시뮬레이션 핸들러
  const handleGenerate = (npc) => {
    setGeneratingId(npc.id);
    
    let message = '';
    let output = {};
    let completionStatus = '결과물 렌더링 완료 ✨';

    // 이전 에이전트들의 결과물을 바탕으로 협업(조합) 로직 수행
    if (npc.specialty === 'text') {
      message = '새로운 프로젝트 기획안 작성 중... 📝';
      output = { type: 'text', content: '혁신적인 AI 서비스 기획안 초안이 작성되었습니다. 팀원들에게 공유합니다!' };
      completionStatus = '기획안 작성 완료! 공유할게요.';
    } else if (npc.specialty === 'code') {
      if (mediaOutputs[1]) { // 박팀장(text)의 결과물이 있을 때
        message = '박팀장님의 기획안을 분석하여 로직 설계 중... 🧠';
        output = { type: 'code', content: '// 박팀장님 기획안 요구사항 반영 완료\nfunction initAI() {\n  return "System Ready";\n}' };
        completionStatus = '기획안 기반 코딩 완료! 💻';
      } else {
        message = '핵심 로직 구현 중... 💻';
        output = { type: 'code', content: 'function initAI() {\n  return "System Ready";\n}' };
      }
    } else if (npc.specialty === 'image') {
      if (mediaOutputs[1]) {
        message = '기획안 컨셉에 맞춰 브랜드 이미지 생성 중... 🎨';
        completionStatus = '컨셉 맞춤 이미지 렌더링 완료! 🖼️';
      } else {
        message = '이미지 렌더링 중... 🎨';
      }
      output = { type: 'image', content: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=400&q=80' };
    } else if (npc.specialty === 'video') {
      if (mediaOutputs[3]) { // 이픽셀(image)의 결과물이 있을 때
        message = '이픽셀님의 이미지를 영상으로 변환 중 (I2V) 🎬';
        completionStatus = '이미지 기반 영상 렌더링 완료! 🎥';
      } else {
        message = '영상 렌더링 중... 🎬';
      }
      output = { type: 'video', content: 'https://www.w3schools.com/html/mov_bbb.mp4' };
    }

    setGeneratingMessage(message);

    setTimeout(() => {
      setGeneratingId(null);
      setMediaOutputs(prev => ({ ...prev, [npc.id]: output }));
      // 활동 로그 추가 유도
      setNpcs(curr => curr.map(n => n.id === npc.id ? { ...n, status: completionStatus } : n));
    }, 2500); // 2.5초 지연
  };

  // 드래그 관련 핸들러
  const handleMouseDown = (e, id) => {
    e.preventDefault(); // 기본 드래그 동작 방지
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);
    draggingIdRef.current = id;
  };

  const handleMouseMove = (e) => {
    if (!draggingIdRef.current || !officeRef.current) return;

    const rect = officeRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    // 오피스 밖을 벗어나지 않도록 좌표 보정
    newX = Math.max(5, Math.min(95, newX));
    newY = Math.max(5, Math.min(95, newY));

    setNpcs((currentNpcs) =>
      currentNpcs.map((npc) =>
        npc.id === draggingIdRef.current ? { ...npc, x: newX, y: newY } : npc
      )
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    draggingIdRef.current = null;
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-200 font-sans">
      {/* 메인 'Office' 영역 */}
      <div className="flex-1 p-6 relative flex flex-col">
        <div 
          ref={officeRef}
          className="w-full h-full bg-slate-800 rounded-3xl overflow-hidden relative shadow-2xl border border-slate-700 flex-1"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 격자 무늬 배경 (Grid Background) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          
          {/* 상단 오피스 타이틀 */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 text-xl font-bold text-slate-300 bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-700 shadow-lg">
            <Cpu className="w-6 h-6 text-indigo-400" />
            DevSim Office
          </div>

          {/* NPC 렌더링 */}
          {npcs.map((npc) => {
            const isSelected = selectedId === npc.id;
            const Icon = npc.icon || User;
            return (
              <div
                key={npc.id}
                className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{ 
                  left: `${npc.x}%`, 
                  top: `${npc.y}%`,
                  transition: 'left 3s ease-in-out, top 3s ease-in-out' // 위치 이동 시 부드러운 전환 효과
                }}
                onClick={() => setSelectedId(npc.id)}
              >
                {/* 프로그레스 바 (작업 렌더링 중) */}
                {generatingId === npc.id && (
                  <div className="absolute bottom-16 px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl shadow-xl z-30 flex flex-col items-center gap-2 whitespace-nowrap border border-indigo-500/50">
                    <span className="flex items-center gap-2 text-indigo-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> 
                      {generatingMessage}
                    </span>
                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full w-full animate-pulse"></div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                )}

                {/* 결과물 멀티모달 뷰어 말풍선 */}
                {mediaOutputs[npc.id] && generatingId !== npc.id && (
                  <div className="absolute bottom-16 flex flex-col items-center z-40 transition-all duration-300">
                    <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 w-max max-w-[220px]">
                      <div className="flex justify-between items-center px-1 border-b border-slate-700 pb-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                          {mediaOutputs[npc.id].type === 'image' ? <ImageIcon className="w-3 h-3"/> : 
                           mediaOutputs[npc.id].type === 'video' ? <Video className="w-3 h-3"/> : 
                           mediaOutputs[npc.id].type === 'code' ? <Code className="w-3 h-3"/> : <FileText className="w-3 h-3"/>}
                          {mediaOutputs[npc.id].type} RESULT
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); setMediaOutputs(prev => { const n = {...prev}; delete n[npc.id]; return n; }) }} className="text-slate-500 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3"/>
                        </button>
                      </div>
                      
                      <div className="w-full flex justify-center">
                        {mediaOutputs[npc.id].type === 'text' && (
                          <p className="text-xs text-slate-200 text-center whitespace-normal p-1 leading-relaxed">
                            {mediaOutputs[npc.id].content}
                          </p>
                        )}
                        {mediaOutputs[npc.id].type === 'code' && (
                          <pre className="text-[10px] text-emerald-400 font-mono bg-[#1e1e1e] p-2 rounded-lg w-full overflow-x-auto text-left border border-slate-700 shadow-inner">
                            {mediaOutputs[npc.id].content}
                          </pre>
                        )}
                        {mediaOutputs[npc.id].type === 'image' && (
                          <div className="relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); setViewingImage(mediaOutputs[npc.id].content); }}>
                            <img src={mediaOutputs[npc.id].content} alt="result" className="w-32 h-32 object-cover rounded-lg border border-slate-700 transition-transform group-hover:scale-[1.02]" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg backdrop-blur-sm">
                              <span className="text-white text-xs font-bold">크게 보기</span>
                            </div>
                          </div>
                        )}
                        {mediaOutputs[npc.id].type === 'video' && (
                          <video src={mediaOutputs[npc.id].content} className="w-40 rounded-lg border border-slate-700 shadow-md bg-black" controls onClick={e => e.stopPropagation()} />
                        )}
                      </div>
                    </div>
                    <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800 -mt-[1px]"></div>
                  </div>
                )}

                {/* 이름표 (Name Tag) */}
                <div className={`mb-2 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap shadow-lg transition-all duration-300 ${
                  isSelected 
                    ? 'bg-white text-slate-900 scale-110' 
                    : 'bg-slate-700 text-white opacity-80 group-hover:opacity-100 group-hover:-translate-y-1 border border-slate-600'
                }`}>
                  {npc.name}
                </div>
                
                {/* 캐릭터 아바타 */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 ${npc.color} ${
                  isSelected 
                    ? 'ring-4 ring-white scale-110 shadow-xl' 
                    : 'ring-2 ring-slate-600 group-hover:scale-105'
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                {/* 선택 시 나타나는 효과 (Pulse Effect) */}
                {isSelected && (
                  <div className={`absolute w-12 h-12 rounded-full animate-ping opacity-30 ${npc.color} pointer-events-none`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 오른쪽 'Control Panel' 사이드바 */}
      <div className="w-80 lg:w-96 bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Control Panel</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowApiModal(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="API Settings">
              <Key className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {selectedNPC ? (
            <div className="space-y-6">
              {/* 프로필 카드 영역 */}
              <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-inner">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${selectedNPC.color}`}>
                  {React.createElement(selectedNPC.icon || User, { className: "w-7 h-7 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedNPC.name}</h3>
                  <p className="text-slate-400 text-sm font-medium">{selectedNPC.role}</p>
                </div>
              </div>

              {/* 상태 정보 영역 */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-4 shadow-inner">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-emerald-400" /> Current Status
                </h4>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-200">{selectedNPC.status}</p>
                </div>
              </div>

              {/* 상세 정보 영역 */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-4 shadow-inner">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  <Info className="w-4 h-4 text-blue-400" /> Agent Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">ID</span>
                    <span className="font-mono text-slate-200">#{selectedNPC.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Location X</span>
                    <span className="font-mono text-slate-200">{Math.round(selectedNPC.x)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Location Y</span>
                    <span className="font-mono text-slate-200">{Math.round(selectedNPC.y)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 선택된 NPC가 없을 때 표시할 화면
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <div className="p-4 bg-slate-900 rounded-full border border-slate-700 shadow-inner">
                <User className="w-12 h-12 opacity-50" />
              </div>
              <p className="text-lg font-medium text-slate-400">Select an NPC</p>
              <p className="text-sm text-center">사무실의 에이전트를 클릭하여<br/>상세 정보를 확인하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}