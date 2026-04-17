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
  Video,
  Briefcase,
  Bot,
  Download,
  Trash2,
  Copy,
  UserPlus,
  Send,
  Grid,
  Sparkles
  Sparkles,
  Pause,
  FileDown
} from 'lucide-react';

// 초기 NPC 데이터 구성 (특기 및 미디어 역할군 부여)
const initialNPCs = [
  { id: 1, name: '박팀장', role: 'Project Manager', specialty: 'text', model: 'gpt-4o', apiKey: '', persona: '당신은 10년 차 IT 프로젝트 매니저입니다. 항상 일정을 준수하고 명확하게 소통합니다.', x: 20, y: 30, color: 'bg-blue-500', icon: FileText, status: '프로젝트 기획안 작성 중' },
  { id: 2, name: '김개발', role: 'Software Engineer', specialty: 'code', model: 'claude-3-5-sonnet', apiKey: '', persona: '당신은 시니어 프론트엔드 개발자입니다. 클린 코드와 성능 최적화를 중요하게 생각합니다.', x: 60, y: 25, color: 'bg-green-500', icon: Code, status: '핵심 로직 구현 중' },
  { id: 3, name: '이픽셀', role: 'UI/UX Designer', specialty: 'image', model: 'dall-e-3', apiKey: '', persona: '당신은 트렌디한 감각을 지닌 UI/UX 디자이너입니다. 사용자 경험을 최우선으로 고려합니다.', x: 75, y: 65, color: 'bg-purple-500', icon: Palette, status: '브랜드 로고 디자인 구상 중' },
  { id: 4, name: '강무비', role: 'Video Creator', specialty: 'video', model: 'sora', apiKey: '', persona: '당신은 감각적인 영상 편집자입니다. 시선을 사로잡는 트랜지션과 효과를 잘 사용합니다.', x: 30, y: 70, color: 'bg-rose-500', icon: Video, status: '홍보 영상 렌더링 준비 중' },
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
  const [apiKeys, setApiKeys] = useState({ llm: '', image: '', video: '', audio: '', slackWebhookUrl: '', discordWebhookUrl: '' });
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [mediaOutputs, setMediaOutputs] = useState({});
  const [generatingMessage, setGeneratingMessage] = useState('');
  const [activeConnection, setActiveConnection] = useState(null); // 에이전트 간 협업 시각화를 위한 연결 상태
  const [viewingImage, setViewingImage] = useState(null);
  const [viewingVideo, setViewingVideo] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // 에이전트 커스터마이징을 위한 State
  const [editingAgent, setEditingAgent] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [theme, setTheme] = useState('grid');
  const [logHeight, setLogHeight] = useState(300); // Activity Log 패널의 초기 높이
  const [isResizing, setIsResizing] = useState(false);

  const officeRef = useRef(null);
  const draggingIdRef = useRef(null);
  const prevNpcsRef = useRef(initialNPCs);
  const shoutTimeoutRef = useRef(null);

  // 로컬 스토리지에서 API 키 및 커스텀 에이전트 데이터 불러오기
  useEffect(() => {
    const savedKeys = localStorage.getItem('devsim_keys');
    if (savedKeys) setApiKeys(JSON.parse(savedKeys));

    const savedTheme = localStorage.getItem('devsim_theme');
    if (savedTheme) setTheme(savedTheme);

    const savedAgents = localStorage.getItem('devsim_agents');
    if (savedAgents) {
      try {
        const parsed = JSON.parse(savedAgents);
        
        const availableIcons = [Bot, User, Briefcase, Database, Cpu];

        const restored = parsed.map(savedNpc => {
          const initNpc = initialNPCs.find(i => i.id === savedNpc.id);
          if (initNpc) {
            // 기존 NPC는 초기 데이터의 아이콘을 사용하고, 저장된 데이터로 덮어쓰기
            return { ...initNpc, ...savedNpc };
          } else {
            // 새로 추가된 NPC는 규칙에 따라 아이콘 부여
            const newAgentIndex = savedNpc.id - initialNPCs.length - 1;
            return {
              ...savedNpc,
              icon: availableIcons[newAgentIndex >= 0 ? newAgentIndex % availableIcons.length : 0],
            };
          }
        });
        setNpcs(restored);
        prevNpcsRef.current = restored;
      } catch(e) {
        console.error("Failed to parse saved agents", e);
        localStorage.removeItem('devsim_agents');
      }
    }
  }, []);

  // NPC가 선택될 때 편집 폼에 데이터 세팅
  useEffect(() => {
    if (selectedId) {
      const npc = npcs.find(n => n.id === selectedId);
      if (npc) setEditingAgent({ ...npc });
    } else {
      setEditingAgent(null);
    }
  }, [selectedId]);

  // API 키 저장 핸들러
  const handleSaveKeys = () => {
    localStorage.setItem('devsim_keys', JSON.stringify(apiKeys));
    setToastMessage('API 키가 저장되었습니다 🔐');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const themes = {
    grid: { name: 'Grid', icon: Grid, style: 'bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px]' },
    circuit: { name: 'Circuit', icon: Cpu, style: 'bg-slate-900 bg-[url(https://www.transparenttextures.com/patterns/integrated.png)]' },
    space: { name: 'Space', icon: Sparkles, style: 'bg-slate-900 bg-[url(https://www.transparenttextures.com/patterns/stardust.png)]' }
  };

  const handleSetTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
      localStorage.setItem('devsim_theme', newTheme);
    }
  };

  // 에이전트 설정 저장 핸들러
  const handleSaveAgent = () => {
    if (!editingAgent) return;
    
    const updatedNpcs = npcs.map(n => n.id === editingAgent.id ? { ...n, ...editingAgent } : n);
    setNpcs(updatedNpcs);
    
    // 아이콘 등 비직렬화(Non-serializable) 데이터 제외 후 저장
    const toSave = updatedNpcs.map(({ icon, ...rest }) => rest);
    localStorage.setItem('devsim_agents', JSON.stringify(toSave));
    
    setToastMessage('에이전트 동기화 완료 ✨');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 새로운 에이전트 추가 핸들러
  const handleAddAgent = () => {
    const newId = npcs.length > 0 ? Math.max(...npcs.map(n => n.id)) + 1 : 1;

    // 새로운 NPC를 위한 색상 및 아이콘 풀
    const availableColors = ['bg-yellow-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-pink-500'];
    const availableIcons = [Bot, User, Briefcase, Database, Cpu];
    
    const newAgentIndex = newId - initialNPCs.length - 1;

    const newAgent = {
      id: newId,
      name: `에이전트 ${newId}`,
      role: 'Generalist',
      specialty: 'text',
      model: 'gpt-4o',
      apiKey: '',
      persona: '당신은 다재다능한 AI 어시스턴트입니다. 주어진 모든 작업에 최선을 다합니다.',
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      color: availableColors[newAgentIndex >= 0 ? newAgentIndex % availableColors.length : 0],
      icon: availableIcons[newAgentIndex >= 0 ? newAgentIndex % availableIcons.length : 0],
      status: '새롭게 합류! 대기 중...',
    };

    const updatedNpcs = [...npcs, newAgent];
    setNpcs(updatedNpcs);
    const toSave = updatedNpcs.map(({ icon, ...rest }) => rest);
    localStorage.setItem('devsim_agents', JSON.stringify(toSave));
    setSelectedId(newId);
    setToastMessage('새로운 에이전트가 추가되었습니다 🤖');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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

  // 사이드바 리사이징 로직
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isResizing) return;
      // 창의 하단에서부터 마우스 Y좌표까지의 거리를 계산하여 높이로 설정
      const newHeight = window.innerHeight - e.clientY;
      // 로그 패널의 최소 높이(150px)와 최대 높이(창 높이 - 상단 여유공간 200px) 제한
      setLogHeight(Math.max(150, Math.min(newHeight, window.innerHeight - 200)));
    };

    const handleGlobalMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isResizing]);

  // 무작위 이동을 위한 Effect Hook
  useEffect(() => {
    if (isPaused) return; // 일시정지 상태면 이동 로직 건너뜀

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
  }, [isPaused]);

  const handleReset = () => {
    if (shoutTimeoutRef.current) clearTimeout(shoutTimeoutRef.current);
    setNpcs(initialNPCs);
    localStorage.removeItem('devsim_agents');
    setLogs([]);
    setSelectedId(null);
    setEditingNpcId(null);
    setDraggingId(null);
    draggingIdRef.current = null;
    prevNpcsRef.current = initialNPCs;
    setGeneratingId(null);
    setActiveConnection(null);
    setMediaOutputs({});
    setGeneratingMessage('');
  };

  // 테스트 명령어 핸들러
  const handleTestCommand = () => {
    setToastMessage('🚀 테스트 명령어가 실행되었습니다!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    setNpcs((currentNpcs) => currentNpcs.map((npc) => ({
      ...npc,
      x: Math.max(10, Math.min(90, Math.random() * 100)),
      y: Math.max(10, Math.min(90, Math.random() * 100)),
      status: '테스트 명령어 실행 중 🛠️'
    })));
  };

  // 프로젝트 결과물 통합 익스포트 (Markdown)
  const handleExportProject = () => {
    if (Object.keys(mediaOutputs).length === 0) {
      setToastMessage('내보낼 결과물이 없습니다. 먼저 작업을 실행해주세요! 😅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    let markdown = `# 🚀 DevSim Project Report\n\n**생성 일시:** ${new Date().toLocaleString()}\n\n---\n\n`;

    npcs.forEach(npc => {
      const output = mediaOutputs[npc.id];
      if (output) {
        markdown += `## 🧑‍💻 [${npc.role}] ${npc.name}의 작업물\n\n`;
        if (output.type === 'text') {
          markdown += `${output.content}\n\n`;
        } else if (output.type === 'code') {
          markdown += \`\`\`javascript\n${output.content}\n\`\`\`\n\n\`;
        } else if (output.type === 'image') {
          markdown += `!Generated Image\n\n`;
        } else if (output.type === 'video') {
          markdown += `🎥 비디오 결과물 링크 (클릭하여 확인)\n\n`;
        }
        markdown += `---\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DevSim_Project_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage('프로젝트 리포트가 다운로드되었습니다 📝');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 선택된 NPC 찾기
  const selectedNPC = npcs.find(npc => npc.id === selectedId);

  // 미디어 생성 시뮬레이션 핸들러
  const handleGenerate = async (npc) => {
    setGeneratingId(npc.id);
    
    let message = '';
    let output = {};
    let completionStatus = '결과물 렌더링 완료 ✨';
    let sourceId = null;

    // 이전 에이전트들의 결과물을 바탕으로 협업(조합) 로직 수행
    if (npc.specialty === 'text' || npc.specialty === 'code') {
      const apiKey = npc.apiKey || apiKeys.llm;
      if (!apiKey) {
        alert('LLM API 키가 설정되지 않았습니다. 전역 API 키 또는 에이전트 개별 API 키를 설정해주세요.');
        setGeneratingId(null);
        return;
      }

      let systemPrompt = npc.persona || '당신은 도움이 되는 AI 어시스턴트입니다.';
      let userPrompt = '';

      // 기존에 생성된 코드 결과물이 있는지 확인 (author ID와 함께)
      const existingCodeEntry = Object.entries(mediaOutputs).find(([_, m]) => m.type === 'code');

      if (npc.specialty === 'text') {
        if (existingCodeEntry) { // 작성된 코드가 있다면 코드 리뷰 수행
          sourceId = Number(existingCodeEntry[0]);
          message = '작성된 코드 리뷰 중 (LLM)... 🧐';
          completionStatus = '코드 리뷰 완료! 피드백을 확인하세요. 📝';
          userPrompt = `다음 코드를 리뷰하고, 보안 취약점이나 개선점, 혹은 잘된 점을 3~4문장으로 짧고 명확하게 피드백해줘.\n\n[코드]\n${existingCodeEntry[1].content}`;
        } else { // 코드가 없다면 기존처럼 기획안 작성
          message = '새로운 프로젝트 기획안 작성 중 (LLM)... 📝';
          completionStatus = '기획안 작성 완료! 공유할게요.';
          userPrompt = '새로운 AI 서비스에 대한 간단한 프로젝트 기획안 초안을 3~4문장으로 짧게 작성해줘.';
        }
      } else {
        if (mediaOutputs[1]) sourceId = 1;
        message = mediaOutputs[1] ? '기획안을 분석하여 로직 설계 중 (LLM)... 🧠' : '핵심 로직 구현 중 (LLM)... 💻';
        completionStatus = '기획안 기반 코딩 완료! 💻';
        userPrompt = mediaOutputs[1] 
          ? `다음 기획안을 바탕으로 프론트엔드 컴포넌트나 백엔드 핵심 로직을 작성해줘. 주석도 포함해줘.\n\n[기획안]\n${mediaOutputs[1].content}\n\n마크다운 코드 블록(```) 없이 오직 코드 텍스트만 반환해줘.` 
          : '간단한 로그인 API 로직이나 리액트 컴포넌트 코드를 작성해줘. 마크다운 코드 블록(```) 없이 오직 코드 텍스트만 반환해줘.';
      }

      if (sourceId) setActiveConnection({ source: sourceId, target: npc.id });
      setGeneratingMessage(message);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: npc.model || 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'LLM API 요청 실패');
        }
        
        const data = await response.json();
        let generatedText = data.choices.message.content;

        // 마크다운 백틱(```) 제거 방어 로직 (순수 코드만 남기기 위함)
        if (npc.specialty === 'code') {
          generatedText = generatedText.replace(/```[\w]*\n/g, '').replace(/```/g, '').trim();
        }

        output = { type: npc.specialty, content: generatedText };
      } catch (error) {
        console.error('LLM API Error:', error);
        alert(`텍스트/코드 생성 실패: ${error.message}`);
        setGeneratingId(null);
        setActiveConnection(null);
        return;
      }
    } else if (npc.specialty === 'image') {
      // 개별 API 키 우선 적용, 없으면 전역 Image 키, 없으면 전역 LLM 키 사용
      const apiKey = npc.apiKey || apiKeys.image || apiKeys.llm; 
      if (!apiKey) {
        alert('API 키가 설정되지 않았습니다. 전역 API 키 또는 에이전트 개별 API 키를 설정해주세요.');
        setGeneratingId(null);
        return;
      }

      if (mediaOutputs[1]) {
        sourceId = 1;
        message = '기획안 컨셉에 맞춰 브랜드 이미지 생성 중 (DALL-E 3)... 🎨';
        completionStatus = '컨셉 맞춤 이미지 렌더링 완료! 🖼️';
      } else {
        message = '이미지 렌더링 중 (DALL-E 3)... 🎨';
      }
      
      if (sourceId) setActiveConnection({ source: sourceId, target: npc.id });
      setGeneratingMessage(message);

      // 박팀장의 기획안 결과물이 있다면 이를 포함하여 프롬프트 작성
      let userPrompt = "IT 서비스에 어울리는 트렌디하고 세련된 브랜드 로고나 일러스트를 그려줘. 깔끔하고 직관적인 디자인으로.";
      if (mediaOutputs[1]) {
        userPrompt += `\n\n다음 기획안 컨셉을 적극 반영해줘:\n${mediaOutputs[1].content}`;
      }

      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: userPrompt,
            n: 1,
            size: "1024x1024"
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'API 요청 실패');
        }
        
        const data = await response.json();
        // OpenAI DALL-E 3 API가 리턴한 이미지 URL 세팅
        output = { type: 'image', content: data.data[0].url };
      } catch (error) {
        console.error('DALL-E 3 Error:', error);
        alert(`이미지 생성 실패: ${error.message}`);
        setGeneratingId(null);
        setActiveConnection(null);
        return;
      }
    } else if (npc.specialty === 'video') {
      if (mediaOutputs[3]) { // 이픽셀(image)의 결과물이 있을 때
        sourceId = 3;
        message = '이픽셀님의 이미지를 영상으로 변환 중 (I2V) 🎬';
        completionStatus = '이미지 기반 영상 렌더링 완료! 🎥';
      } else {
        message = '영상 렌더링 중... 🎬';
      }
      output = { type: 'video', content: 'https://www.w3schools.com/html/mov_bbb.mp4' };
      
      if (sourceId) setActiveConnection({ source: sourceId, target: npc.id });
      setGeneratingMessage(message);
    }

    // API를 호출하지 않는 영상 작업만 기존처럼 2.5초 지연을 두어 시뮬레이션
    if (npc.specialty === 'video') {
      await new Promise(resolve => setTimeout(resolve, 2500));
      try {
        const apiKey = npc.apiKey || apiKeys.video || apiKeys.llm;
        if (!apiKey) {
          alert('Video API 키가 설정되지 않았습니다. 설정 모달에서 Video API 키를 입력해주세요.');
          setGeneratingId(null);
          setActiveConnection(null);
          return;
        }

        // Luma AI (Dream Machine) REST API 연동
        const requestBody = {
          prompt: "High quality, cinematic, 4k resolution, smooth motion"
        };
        
        // 이픽셀의 결과물(이미지)가 있으면 Image-to-Video 프롬프트로 구성
        if (mediaOutputs[3]) {
          requestBody.keyframes = {
            frame0: { type: "image", url: mediaOutputs[3].content }
          };
          requestBody.prompt = "Animate this image with cinematic camera pan, high quality";
        }

        const createRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!createRes.ok) throw new Error('Video API 요청 실패');
        const createData = await createRes.json();
        let videoUrl = null;

        // 영상 생성이 완료될 때까지 상태 확인 (Polling)
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기 후 재확인
          
          const pollRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${createData.id}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          const pollData = await pollRes.json();
          
          if (pollData.state === 'completed') {
            videoUrl = pollData.assets.video;
            break;
          } else if (pollData.state === 'failed') {
            throw new Error('비디오 생성 실패 (API 내부 오류)');
          }
          
          // 진행 상태 업데이트 (대기 중, 렌더링 중 등)
          setGeneratingMessage(`영상 렌더링 중... (${pollData.state}) 🎬`);
        }
        output = { type: 'video', content: videoUrl };
      } catch (error) {
        console.error('Video API Error:', error);
        alert(`영상 생성 실패: ${error.message}`);
        setGeneratingId(null);
        setActiveConnection(null);
        return;
      }
    }

    setGeneratingId(null);
    setActiveConnection(null); // 작업이 완료되면 연결선 해제
    setMediaOutputs(prev => ({ ...prev, [npc.id]: output }));
    // 활동 로그 추가 유도
    setNpcs(curr => curr.map(n => n.id === npc.id ? { ...n, status: completionStatus } : n));
    
    // 작업 완료 토스트 알림 띄우기
    setToastMessage(`[${npc.name}] ${completionStatus}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // 웹훅으로 결과 전송
    handleWebhookNotifications(npc, output);
  };

  // 웹훅 알림 통합 핸들러
  const handleWebhookNotifications = (npc, output) => {
    if (apiKeys.slackWebhookUrl) {
      sendToSlack(npc, output);
    }
    if (apiKeys.discordWebhookUrl) {
      sendToDiscord(npc, output);
    }
  };

  // 슬랙(Slack) 웹훅 전송 핸들러
  const sendToSlack = async (npc, output) => {
    const createSlackPayload = (npc, output) => {
      const blocks = [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": `🤖 [${npc.name}]님의 작업 완료!`,
            "emoji": true
          }
        },
        {
          "type": "context",
          "elements": [
            { "type": "mrkdwn", "text": `*역할:* ${npc.role} | *특기:* ${output.type}` }
          ]
        }
      ];

      if (output.type === 'text') {
        blocks.push({ "type": "section", "text": { "type": "mrkdwn", "text": `> ${output.content}` } });
      } else if (output.type === 'code') {
        blocks.push({ "type": "section", "text": { "type": "mrkdwn", "text": "```\n" + output.content + "\n```" } });
      } else if (output.type === 'image') {
        blocks.push({ "type": "image", "image_url": output.content, "alt_text": "Generated Image" });
      } else if (output.type === 'video') {
        blocks.push({ "type": "section", "text": { "type": "mrkdwn", "text": `생성된 영상 결과물입니다: <${output.content}|영상 재생하기>` } });
      }
      return { blocks };
    };

    const payload = createSlackPayload(npc, output);

    try {
      const response = await fetch(apiKeys.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error('Failed to send to Slack webhook:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending to Slack webhook:', error);
    }
  };

  // 디스코드(Discord) 웹훅 전송 핸들러
  const sendToDiscord = async (npc, output) => {
    const getColorDecimal = (colorClassName) => {
      const colorMap = {
        'bg-blue-500': 3899894,   // #3b82f6
        'bg-green-500': 2278750,  // #22c55e
        'bg-purple-500': 11032311, // #a855f7
        'bg-rose-500': 15999838,  // #f43f5e
        'bg-yellow-500': 15381256, // #eab308
        'bg-teal-500': 1358006,   // #14b8a6
        'bg-orange-500': 16347926, // #f97316
        'bg-cyan-500': 442196,    // #06b6d4
        'bg-lime-500': 8703000,   // #84cc16
        'bg-pink-500': 15485081,  // #ec4899
      };
      return colorMap[colorClassName] || 5855577; // default: #595959
    };

    const createDiscordPayload = (npc, output) => {
      const embed = {
        author: {
          name: `[${npc.name}]님의 작업 완료!`,
        },
        description: `**역할:** ${npc.role}\n**특기:** ${output.type}`,
        color: getColorDecimal(npc.color),
        timestamp: new Date().toISOString(),
        footer: {
          text: "DevSim"
        }
      };

      if (output.type === 'text') {
        embed.fields = [{ name: '결과물', value: output.content.substring(0, 1024) }];
      } else if (output.type === 'code') {
        embed.description += "\n\n**결과물:**\n```" + (output.content.substring(0, 1500)) + "\n```";
      } else if (output.type === 'image') {
        embed.fields = [{ name: '결과물', value: '아래 이미지 확인' }];
        embed.image = { url: output.content };
      } else if (output.type === 'video') {
        embed.fields = [{ name: '결과물', value: `영상 재생하기` }];
      }

      return {
        username: "DevSim 알림봇",
        avatar_url: "https://i.imgur.com/4M34hi2.png", // Generic Bot Icon
        embeds: [embed],
      };
    };

    const payload = createDiscordPayload(npc, output);

    try {
      const response = await fetch(apiKeys.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error('Failed to send to Discord webhook:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error sending to Discord webhook:', error);
    }
  };

  // 미디어 다운로드 핸들러
  const handleDownloadMedia = async (e, url, type) => {
    e.stopPropagation(); // 부모 요소 클릭 이벤트(크게 보기) 방지
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `devsim_${type}_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // CORS 등으로 fetch 실패 시 새 창으로 열기 (폴백)
      const link = document.createElement('a');
      link.href = url;
      link.download = `devsim_${type}_${new Date().getTime()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
    if (draggingIdRef.current) {
      setNpcs((currentNpcs) =>
        currentNpcs.map((npc) =>
          npc.id === draggingIdRef.current ? { ...npc, status: '새로운 위치로 이동 완료 📍' } : npc
        )
      );
    }
    setDraggingId(null);
    draggingIdRef.current = null;
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-200 font-sans relative">
      {/* API 키 설정 모달 */}
      {showApiModal && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/95 w-full max-w-lg rounded-3xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.5)] border border-slate-600 p-8 relative overflow-hidden">
            {/* 상단 그라데이션 장식 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            {/* 배경 희미한 빛 효과 */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center gap-3 mb-2">
                  <Key className="w-7 h-7 text-indigo-400" /> 
                  전역 API 키 설정
                </h3>
                <p className="text-sm text-slate-400">에이전트들이 사용할 기본 AI 모델 API 키를 등록하세요.<br/>개별 설정이 없는 에이전트는 이 키를 사용합니다.</p>
              </div>
              <button onClick={() => setShowApiModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors bg-slate-800 border border-slate-700 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Bot className="w-4 h-4 text-emerald-400" /> LLM API Key</label>
                <input 
                  type="password"
                  value={apiKeys.llm}
                  onChange={(e) => setApiKeys({...apiKeys, llm: e.target.value})}
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="sk-..."
                />
                <p className="text-xs text-slate-500 ml-1">OpenAI, Claude, Gemini 등 주력 텍스트/코드 생성 모델용</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Palette className="w-4 h-4 text-pink-400" /> Image Generation API Key</label>
                <input 
                  type="password"
                  value={apiKeys.image}
                  onChange={(e) => setApiKeys({...apiKeys, image: e.target.value})}
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="LLM 키와 동일하면 비워두세요"
                />
                <p className="text-xs text-slate-500 ml-1">DALL-E 3 등 이미지 렌더링을 위한 전용 키 (선택)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Video className="w-4 h-4 text-purple-400" /> Video Generation API Key</label>
                <input 
                  type="password"
                  value={apiKeys.video || ''}
                  onChange={(e) => setApiKeys({...apiKeys, video: e.target.value})}
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="Luma AI 또는 Runway API 키 입력 (선택)"
                />
                <p className="text-xs text-slate-500 ml-1">Luma AI 등 비디오 렌더링을 위한 전용 키</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Send className="w-4 h-4 text-cyan-400" /> Slack Webhook URL (선택)</label>
                <input 
                  type="text"
                  value={apiKeys.slackWebhookUrl || ''}
                  onChange={(e) => setApiKeys({...apiKeys, slackWebhookUrl: e.target.value})}
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="https://hooks.slack.com/services/..."
                />
                <p className="text-xs text-slate-500 ml-1">작업 완료 시 결과물을 지정된 Slack 채널로 전송합니다.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Send className="w-4 h-4 text-indigo-400" /> Discord Webhook URL (선택)</label>
                <input 
                  type="text"
                  value={apiKeys.discordWebhookUrl || ''}
                  onChange={(e) => setApiKeys({...apiKeys, discordWebhookUrl: e.target.value})}
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="https://discord.com/api/webhooks/..."
                />
                <p className="text-xs text-slate-500 ml-1">작업 완료 시 결과물을 지정된 Discord 채널로 전송합니다.</p>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 relative z-10">
              <button onClick={() => setShowApiModal(false)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors border border-slate-600">취소</button>
              <button onClick={() => { handleSaveKeys(); setShowApiModal(false); }} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25 transform hover:-translate-y-0.5">
                <Save className="w-4 h-4" /> 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 글로벌 토스트 알림 */}
      {showToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce border border-indigo-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* 이미지 크게 보기 모달 */}
      {viewingImage && (
        <div 
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-8 cursor-zoom-out"
          onClick={() => setViewingImage(null)}
        >
          <img 
            src={viewingImage} 
            alt="Enlarged result" 
            className="max-w-full max-h-full rounded-2xl shadow-2xl border border-slate-700 object-contain cursor-default"
            onClick={(e) => e.stopPropagation()} // 이미지를 클릭했을 때는 닫히지 않게 하려면 유지, 클릭 시 닫히게 하려면 이 줄을 제거하세요.
          />
          <button 
            onClick={() => setViewingImage(null)}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors backdrop-blur-sm cursor-pointer shadow-lg border border-slate-600"
            title="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* 비디오 크게 보기 모달 */}
      {viewingVideo && (
        <div 
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setViewingVideo(null)}
        >
          <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <video 
              src={viewingVideo} 
              className="w-full rounded-2xl shadow-2xl border border-slate-700 bg-black"
              controls
              autoPlay
            />
          </div>
          <button 
            onClick={() => setViewingVideo(null)}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors backdrop-blur-sm cursor-pointer shadow-lg border-slate-600"
            title="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* 메인 'Office' 영역 */}
      <div className="flex-1 p-6 relative flex flex-col">
        <div 
          ref={officeRef}
          className="w-full h-full bg-slate-800 rounded-3xl overflow-hidden relative shadow-2xl border border-slate-700 flex-1"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 테마 배경 */}
          <div className={`absolute inset-0 transition-all duration-500 ${themes[theme].style}`}></div>
          
          {/* 에이전트 간 협업 레이저(연결선) 시각화 */}
          {activeConnection && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {(() => {
                const sourceNpc = npcs.find(n => n.id === activeConnection.source);
                const targetNpc = npcs.find(n => n.id === activeConnection.target);
                if (!sourceNpc || !targetNpc) return null;
                return (
                  <g className="animate-pulse">
                    {/* Source & Target Nodes (Data points) */}
                    <circle cx={`${sourceNpc.x}%`} cy={`${sourceNpc.y}%`} r="8" fill="#6366f1" className="animate-ping opacity-75" />
                    <circle cx={`${targetNpc.x}%`} cy={`${targetNpc.y}%`} r="8" fill="#a855f7" className="animate-ping opacity-75" />
                    {/* Glowing Trail */}
                    <line
                      x1={`${sourceNpc.x}%`}
                      y1={`${sourceNpc.y}%`}
                      x2={`${targetNpc.x}%`}
                      y2={`${targetNpc.y}%`}
                      stroke="#818cf8"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="opacity-40"
                    />
                    {/* Core Laser (Dashed) */}
                    <line
                      x1={`${sourceNpc.x}%`}
                      y1={`${sourceNpc.y}%`}
                      x2={`${targetNpc.x}%`}
                      y2={`${targetNpc.y}%`}
                      stroke="#e879f9"
                      strokeWidth="2"
                      strokeDasharray="8 8"
                      strokeLinecap="round"
                      className="opacity-90"
                    />
                  </g>
                );
              })()}
            </svg>
          )}

          {/* 상단 오피스 타이틀 */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
            <div className="flex items-center gap-2 text-xl font-bold text-slate-300 bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-700 shadow-lg">
              <Cpu className="w-6 h-6 text-indigo-400" />
              DevSim Office
            </div>
            {/* 테마 변경 버튼 */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-full backdrop-blur-sm border border-slate-700 shadow-lg">
              {Object.entries(themes).map(([key, { name, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => handleSetTheme(key)}
                  className={`p-2 rounded-full transition-colors ${
                    theme === key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={`${name} 테마로 변경`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
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
                  transition: draggingId === npc.id ? 'none' : 'left 3s ease-in-out, top 3s ease-in-out' // 드래그 중에는 애니메이션 제거
                }}
                onClick={() => setSelectedId(npc.id)}
                onMouseDown={(e) => handleMouseDown(e, npc.id)}
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
                          <div className="relative group w-full">
                            <pre className="text-[10px] text-emerald-400 font-mono bg-[#1e1e1e] p-2 pr-7 rounded-lg w-full overflow-x-auto text-left border border-slate-700 shadow-inner">
                              {mediaOutputs[npc.id].content}
                            </pre>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(mediaOutputs[npc.id].content);
                                setToastMessage('코드가 클립보드에 복사되었습니다 📋');
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 3000);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-white bg-slate-700/80 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="코드 복사"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {mediaOutputs[npc.id].type === 'image' && (
                          <div className="relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); setViewingImage(mediaOutputs[npc.id].content); }}>
                            <img src={mediaOutputs[npc.id].content} alt="result" className="w-32 h-32 object-cover rounded-lg border border-slate-700 transition-transform group-hover:scale-[1.02]" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity rounded-lg backdrop-blur-sm">
                              <span className="text-white text-xs font-bold">크게 보기</span>
                              <button 
                                onClick={(e) => handleDownloadMedia(e, mediaOutputs[npc.id].content, 'image')}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full transition-colors shadow-lg"
                                title="다운로드"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                        {mediaOutputs[npc.id].type === 'video' && (
                          <div className="relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); setViewingVideo(mediaOutputs[npc.id].content); }}>
                            <video src={mediaOutputs[npc.id].content} className="w-40 h-24 object-cover rounded-lg border border-slate-700 shadow-md bg-black" onClick={e => e.stopPropagation()} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg backdrop-blur-sm">
                               <Play className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800 -mt-[1px]"></div>
                  </div>
                )}

                {/* 이름표 (Name Tag) */}
                <div 
                  className={`mb-2 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap shadow-lg transition-all duration-300 ${
                  isSelected 
                    ? 'bg-white text-slate-900 scale-110' 
                    : 'bg-slate-700 text-white opacity-80 group-hover:opacity-100 group-hover:-translate-y-1 border border-slate-600'
                }`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const newName = prompt('NPC의 새로운 이름을 입력하세요:', npc.name);
                    if (newName && newName.trim()) {
                      const updatedNpcs = npcs.map(n => n.id === npc.id ? { ...n, name: newName.trim() } : n);
                      setNpcs(updatedNpcs);
                      if (editingAgent && editingAgent.id === npc.id) {
                        setEditingAgent({ ...editingAgent, name: newName.trim() });
                      }
                      const toSave = updatedNpcs.map(({ icon, ...rest }) => rest);
                      localStorage.setItem('devsim_agents', JSON.stringify(toSave));
                      setToastMessage('이름이 변경되었습니다 ✨');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }
                  }}
                  title="더블클릭하여 이름 변경"
                >
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
            <button
              onClick={handleExportProject}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="프로젝트 결과물 통합 다운로드 (Markdown)"
            >
              <FileDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2 rounded-lg transition-colors ${isPaused ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title={isPaused ? "에이전트 이동 재개" : "에이전트 이동 일시정지 (Freeze)"}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <button
              onClick={handleAddAgent}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Add Agent"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={handleTestCommand}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Test Command"
            >
              <Terminal className="w-5 h-5" />
            </button>
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
                <h3 className="text-2xl font-bold text-white">{editingAgent?.name || selectedNPC.name}</h3>
                <p className="text-slate-400 text-sm font-medium">{editingAgent?.role || selectedNPC.role}</p>
                </div>
              </div>

              {/* 상태 정보 영역 */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-4 shadow-inner">
              <h4 className="flex items-center justify-between text-sm font-semibold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Current Status</span>
                <button 
                  onClick={() => handleGenerate(selectedNPC)}
                  disabled={generatingId === selectedNPC.id}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors shadow-md"
                >
                  {generatingId === selectedNPC.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  작업 지시
                </button>
                </h4>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-200">{selectedNPC.status}</p>
                </div>
              </div>

            {/* 에이전트 커스터마이징 영역 */}
            {editingAgent && (
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-4 shadow-inner mt-6">
                <h4 className="flex items-center justify-between text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-blue-400" /> Agent Config</span>
                </h4>
                
                <div className="space-y-4">
                  {/* 닉네임 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> 닉네임</label>
                    <input 
                      type="text" 
                      value={editingAgent.name} 
                      onChange={(e) => {
                        const newName = e.target.value;
                        setEditingAgent({...editingAgent, name: newName});
                        setNpcs(currentNpcs => 
                          currentNpcs.map(n => n.id === editingAgent.id ? { ...n, name: newName } : n)
                        );
                      }}
                      className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* 역할 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> 역할 (Role)</label>
                    <input 
                      type="text"
                      value={editingAgent.role} 
                      onChange={(e) => setEditingAgent({...editingAgent, role: e.target.value})}
                      className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="예: Software Engineer"
                    />
                  </div>

                  {/* API 모델 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5"/> AI 모델</label>
                    <input 
                      type="text"
                      value={editingAgent.model} 
                      onChange={(e) => setEditingAgent({...editingAgent, model: e.target.value})}
                      className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="예: gpt-4o"
                    />
                  </div>

                  {/* 개별 API 키 (선택사항) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Key className="w-3.5 h-3.5"/> 개별 API Key (선택사항)</label>
                    <input 
                      type="password"
                      value={editingAgent.apiKey || ''} 
                      onChange={(e) => setEditingAgent({...editingAgent, apiKey: e.target.value})}
                      className="w-full bg-slate-900 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="비워두면 전역 키를 사용합니다"
                    />
                  </div>

                  {/* 페르소나 (시스템 프롬프트) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/> 시스템 프롬프트 (Persona)</label>
                    <textarea 
                      value={editingAgent.persona}
                      onChange={(e) => setEditingAgent({...editingAgent, persona: e.target.value})}
                      rows={4}
                      className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      placeholder="이 에이전트가 어떻게 행동해야 하는지 지시사항을 작성하세요..."
                    />
                  </div>
                  
                  <button 
                    onClick={handleSaveAgent}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <Save className="w-4 h-4" /> 설정 저장 및 동기화
                  </button>
                  
                  {/* 동적으로 추가된 에이전트(초기 NPC 배열에 없는 경우)만 삭제 버튼 표시 */}
                  {!initialNPCs.some(n => n.id === editingAgent.id) && (
                    <button 
                      onClick={() => handleDeleteAgent(editingAgent.id)}
                      className="w-full bg-rose-600/80 hover:bg-rose-500 text-white font-bold py-2.5 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      <Trash2 className="w-4 h-4" /> 에이전트 삭제
                    </button>
                  )}
                </div>
              </div>
            )}
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
        
        {/* 사이드바 리사이즈 핸들 */}
        <div 
          className={`h-1.5 w-full bg-slate-700 hover:bg-indigo-500 cursor-ns-resize transition-colors shrink-0 flex items-center justify-center group ${isResizing ? 'bg-indigo-500' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        >
          <div className="w-8 h-0.5 bg-slate-400 group-hover:bg-white rounded-full"></div>
        </div>

        {/* 하단 활동 로그 내역 (Activity Logs) */}
        <div className="bg-slate-900/50 flex flex-col shrink-0" style={{ height: `${logHeight}px` }}>
          <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Activity Logs</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 shadow-inner">
                {logs.length}
              </span>
              <button
                onClick={() => setLogs([])}
                className="p-1 text-slate-500 hover:text-red-400 disabled:text-slate-600 disabled:cursor-not-allowed hover:bg-slate-700 rounded-md transition-colors"
                title="로그 초기화"
                disabled={logs.length === 0}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm transition-all duration-300">
                  <div className={`w-2.5 h-2.5 mt-1 rounded-full shrink-0 shadow-lg ${log.color}`} />
                  <div className="flex-1">
                    <p className="text-slate-300 leading-snug">
                      <span className="font-semibold text-white">{log.name}</span>: {log.status}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{log.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <History className="w-8 h-8 opacity-20" />
                <p className="text-xs">기록된 활동 로그가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}