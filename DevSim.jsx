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
  Sparkles,
  Pause,
  FileDown,
  BrainCircuit,
  LayoutList,
  ThumbsUp,
  ThumbsDown,
  MessageCircle
} from 'lucide-react';
import { callLLM, callImageGen } from './api';
import { sendToSlack, sendToDiscord } from './webhook';

// 사용 가능한 LLM 모델 목록 (2026년 최신 기준)
const availableLLMModels = [
  // 2026 OpenAI
  'gpt-5.4',
  'gpt-5.3-codex',
  'gpt-4o',
  // 2026 Anthropic
  'claude-opus-4.7',
  'claude-code',
  // 2026 Google
  'gemini-3.1-pro',
  // 2026 xAI & Open Source
  'grok-4',
  'deepseek-v4'
];

// 초기 NPC 데이터 구성 (특기 및 미디어 역할군 부여 - 2026년 모델 적용)
const initialNPCs = [
  { id: 1, name: '박팀장', role: 'Project Manager', specialty: 'text', model: 'gpt-5.4', apiKey: '', persona: '당신은 10년 차 IT 프로젝트 매니저입니다. 항상 일정을 준수하고 명확하게 소통합니다.', x: 20, y: 30, color: 'bg-blue-500', icon: FileText, status: '휴식 중... ☕' },
  { id: 2, name: '김개발', role: 'Software Engineer', specialty: 'code', model: 'claude-opus-4.7', apiKey: '', persona: '당신은 시니어 프론트엔드 개발자입니다. 클린 코드와 성능 최적화를 중요하게 생각합니다.', x: 60, y: 25, color: 'bg-green-500', icon: Code, status: '휴식 중... ☕' },
  { id: 3, name: '이픽셀', role: 'UI/UX Designer', specialty: 'image', model: 'nano-banana-2', apiKey: '', persona: '당신은 트렌디한 감각을 지닌 UI/UX 디자이너입니다. 사용자 경험을 최우선으로 고려합니다.', x: 75, y: 65, color: 'bg-purple-500', icon: Palette, status: '휴식 중... ☕' },
  { id: 4, name: '강무비', role: 'Video Creator', specialty: 'video', model: 'sora-2-pro', apiKey: '', persona: '당신은 감각적인 영상 편집자입니다. 시선을 사로잡는 트랜지션과 효과를 잘 사용합니다.', x: 30, y: 70, color: 'bg-rose-500', icon: Video, status: '휴식 중... ☕' },
];

// 무작위로 변경될 상태 메시지 목록
const statusMessages = [
  '휴식 중... ☕',
  '오피스 산책 중 🚶',
  '멍 때리는 중 💭',
  '다음 작업 대기 중 ⏳',
  '스트레칭 중 🤸',
  '창밖 구경 중 🪟',
  '아이디어 구상 중 💡'
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
  const [apiKeys, setApiKeys] = useState({ openai: '', anthropic: '', gemini: '', grok: '', deepseek: '', llm: '', image: '', video: '', audio: '', slackWebhookUrl: '', discordWebhookUrl: '' });
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
  const [activeLogTab, setActiveLogTab] = useState('logs'); // 'logs' | 'thinking'
  const [thinkingLogs, setThinkingLogs] = useState({}); // { [npcId]: [{ type, content, time }] }
  const [confettiId, setConfettiId] = useState(null); // 폭죽 효과 상태
  const [interactionEmoji, setInteractionEmoji] = useState(null); // 대화 시 떠오르는 이모지 상태
  
  // 신규 진화 기능 State
  const [tasks, setTasks] = useState([
    { id: 1, title: 'DevSim 랜딩 페이지 기획서 초안 작성', specialty: 'text', status: 'todo', assignee: null }
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [approvalReq, setApprovalReq] = useState(null); // Human-in-the-loop 상태
  
  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setToastMessage('작업이 삭제되었습니다.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 24/7 자율 주행(Auto) 모드 State
  const [isAutoMode, setIsAutoMode] = useState(false);
  const isAutoModeRef = useRef(false);
  useEffect(() => { isAutoModeRef.current = isAutoMode; }, [isAutoMode]);

  const officeRef = useRef(null);
  const draggingIdRef = useRef(null);
  const prevNpcsRef = useRef(initialNPCs);
  const shoutTimeoutRef = useRef(null);
  const mediaOutputTimeouts = useRef({}); // 결과물 자동 닫기 타임아웃 관리를 위한 Ref

  // 로컬 스토리지에서 API 키 및 커스텀 에이전트 데이터 불러오기
  useEffect(() => {
    const savedKeys = localStorage.getItem('devsim_keys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        // 기존 llm 키를 openai로 마이그레이션 (하위 호환성 유지)
        if (parsedKeys.llm && !parsedKeys.openai) parsedKeys.openai = parsedKeys.llm;
        // 기존 키 상태를 유지하면서 병합
        setApiKeys(prev => ({ ...prev, ...parsedKeys }));
      } catch (e) {
        console.error('API Keys parsing error:', e);
      }
    }

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
      status: '휴식 중... ☕',
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

  // 에이전트 삭제 핸들러
  const handleDeleteAgent = (agentId) => {
    if (!window.confirm("정말로 이 에이전트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    const updatedNpcs = npcs.filter(n => n.id !== agentId);
    setNpcs(updatedNpcs);

    const toSave = updatedNpcs.map(({ icon, ...rest }) => rest);
    localStorage.setItem('devsim_agents', JSON.stringify(toSave));

    if (selectedId === agentId) {
      setSelectedId(null);
    }

    setToastMessage('에이전트가 삭제되었습니다.');
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
          // 드래그 중이거나 작업 중(isBusy)인 NPC는 자동 이동 스킵
          if (npc.id === draggingIdRef.current || npc.isBusy) return npc;

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
  }, [isPaused]);

  const handleReset = () => {
    if (shoutTimeoutRef.current) clearTimeout(shoutTimeoutRef.current);
    Object.values(mediaOutputTimeouts.current).forEach(clearTimeout);
    mediaOutputTimeouts.current = {};
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
    setConfettiId(null);
    setInteractionEmoji(null);
    setTasks([]);
    setCommandInput('');
    setApprovalReq(null);
    setIsAutoMode(false);
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
          markdown += `\`\`\`javascript\n${output.content}\n\`\`\`\n\n`;
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

  // 하단 글로벌 커맨드 입력 핸들러
  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    // 자연어 의도 파악 (간단한 키워드 매칭)
    let specialty = 'text';
    if (commandInput.match(/코드|개발|구현|API|에러|버그|UI/)) specialty = 'code';
    else if (commandInput.match(/이미지|디자인|로고|그림/)) specialty = 'image';
    else if (commandInput.match(/영상|비디오|렌더링|애니메이션/)) specialty = 'video';

    const newTask = {
      id: Date.now() + Math.random(), // 고속 생성 시 ID 중복(Key Collision) 방지
      title: commandInput,
      specialty,
      status: 'todo',
      assignee: null
    };

    setTasks(prev => [...prev, newTask]);
    setCommandInput('');
    setToastMessage('칸반 보드에 새 작업이 등록되었습니다 📋');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 칸반 보드 자동 할당 (Autonomous Queue System)
  useEffect(() => {
    if (isPaused) return;
    const todoTasks = tasks.filter(t => t.status === 'todo');
    if (todoTasks.length === 0) return;

    const assignTimer = setTimeout(() => {
      const idleNpcs = npcs.filter(n => !n.isBusy && generatingId !== n.id && !approvalReq);
      if (idleNpcs.length === 0) return;

      let taskAssigned = false;
      let newTasks = [...tasks];

      for (const npc of idleNpcs) {
        const taskIdx = newTasks.findIndex(t => t.status === 'todo' && t.specialty === npc.specialty);
        if (taskIdx !== -1) {
          const taskToAssign = newTasks[taskIdx];
          newTasks[taskIdx] = { ...taskToAssign, status: 'in-progress', assignee: npc.name };
          taskAssigned = true;
          handleGenerate(npc, taskToAssign); // 에이전트가 작업을 스스로 픽업!
        }
      }
      if (taskAssigned) setTasks(newTasks);
    }, 1500);
    return () => clearTimeout(assignTimer);
  }, [tasks, npcs, isPaused, generatingId, approvalReq]);

  // 미디어 생성 시뮬레이션 핸들러
  const handleGenerate = async (npc, linkedTask = null) => {
    setGeneratingId(npc.id);

    // '생각 일지' 기록을 위한 헬퍼 함수
    const addThinkingLog = (npcId, logEntry) => {
      setThinkingLogs(prev => ({
        ...prev,
        [npcId]: [...(prev[npcId] || []), { ...logEntry, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]
      }));
    };

    // 스트리밍 청크를 처리하는 콜백 함수
    const handleChunk = (chunk) => {
      setThinkingLogs(prev => {
        const currentLogs = prev[npc.id] || [];
        if (currentLogs.length === 0) return prev;
        const lastLogIndex = currentLogs.length - 1;
        const lastLog = currentLogs[lastLogIndex];
        if (lastLog && lastLog.type === 'ai') {
          const updatedLastLog = { ...lastLog, content: lastLog.content + chunk };
          return { ...prev, [npc.id]: [...currentLogs.slice(0, lastLogIndex), updatedLastLog] };
        }
        return prev;
      });
    };
    
    let message = '';
    let output = {};
    let completionStatus = '결과물 렌더링 완료 ✨';
    let sourceId = null;

    // 이전 에이전트들의 결과물을 바탕으로 협업(조합) 로직 수행
    if (npc.specialty === 'text' || npc.specialty === 'code') {
      let globalKey = apiKeys.llm;
      const modelName = npc.model.toLowerCase();
      if (modelName.includes('claude')) globalKey = apiKeys.anthropic || apiKeys.llm;
      else if (modelName.includes('gemini')) globalKey = apiKeys.gemini || apiKeys.llm;
      else if (modelName.includes('grok')) globalKey = apiKeys.grok || apiKeys.llm;
      else if (modelName.includes('deepseek')) globalKey = apiKeys.deepseek || apiKeys.llm;
      else if (modelName.includes('gpt') || modelName.includes('o1')) globalKey = apiKeys.openai || apiKeys.llm;

      const apiKey = npc.apiKey || globalKey;
      if (!apiKey) {
        alert(`[${npc.model}] 모델을 위한 API 키가 설정되지 않았습니다. 전역 API 설정 또는 에이전트 개별 API 키를 확인해주세요.`);
        setGeneratingId(null);
        return;
      }

      // 생각 일지 초기화 및 기록 시작
      setThinkingLogs(prev => ({ ...prev, [npc.id]: [] }));
      addThinkingLog(npc.id, { type: 'system', content: '작업 지시를 수신했습니다. 목표를 분석합니다...' });

      let systemPrompt = npc.persona || '당신은 도움이 되는 AI 어시스턴트입니다.';
      let userPrompt = linkedTask ? linkedTask.title : '';

      // 문서/기획/피드백(text)을 담당한 에이전트의 결과물이 있는지 탐색 (협업 베이스)
      const textOutputEntry = Object.entries(mediaOutputs).find(([_, m]) => m.type === 'text');

      if (npc.specialty === 'text') {
        const isReviewTask = linkedTask && linkedTask.title.includes('[리뷰]');
        if (isReviewTask) {
          const targetSpec = linkedTask.targetSpecialty || 'code';
          const targetOutputEntry = Object.entries(mediaOutputs).find(([_, m]) => m.type === targetSpec) || Object.entries(mediaOutputs).find(([_, m]) => m.type !== 'text');
          
          if (targetOutputEntry) {
            sourceId = Number(targetOutputEntry[0]);
            const outputType = targetOutputEntry[1].type;
            message = `${outputType.toUpperCase()} 결과물 리뷰 중 (LLM)... 🧐`;
            completionStatus = '피드백 작성 완료! 📝';
            
            let reviewContext = targetOutputEntry[1].content;
            if (outputType === 'image' || outputType === 'video') reviewContext = `[시각/미디어 데이터가 생성되었습니다. 프롬프트 의도에 맞게 보완 아이디어를 제시해주세요.]`;
            
            userPrompt += `\n\n다음은 동료가 작업한 [${outputType}] 결과물입니다. 이를 검토하고 더 나은 결과물을 위한 개선점이나 아이디어를 3~4문장으로 명확하게 피드백해주세요.\n\n[결과물/참조]\n${reviewContext}`;
            addThinkingLog(npc.id, { type: 'system', content: `기존 ${outputType} 결과물 리뷰를 시작합니다.` });
          }
        } else {
          message = '새로운 기획안/문서 작성 중 (LLM)... 📝';
          completionStatus = '문서 작성 완료! 📝';
          if (!linkedTask) userPrompt = '새로운 AI 서비스에 대한 간단한 프로젝트 기획안 초안을 3~4문장으로 짧게 작성해줘.';
        }
      } else {
        if (textOutputEntry) sourceId = Number(textOutputEntry[0]);
        message = textOutputEntry ? '피드백/기획안 분석 및 코딩 중 (LLM)... 💻' : '핵심 로직 구현 중 (LLM)... 💻';
        completionStatus = '기획안 기반 코딩 완료! 💻';
        
        if (linkedTask) {
          userPrompt += textOutputEntry ? `\n\n[참고 문서/피드백]\n${textOutputEntry[1].content}` : '';
        } else {
          userPrompt = textOutputEntry 
          ? `다음 기획안/피드백을 바탕으로 프론트엔드 컴포넌트나 백엔드 핵심 로직을 작성해줘. 주석도 포함해줘.\n\n[참고 문서]\n${textOutputEntry[1].content}\n\n마크다운 코드 블록(\`\`\`) 없이 오직 코드 텍스트만 반환해줘.` 
          : '간단한 로그인 API 로직이나 리액트 컴포넌트 코드를 작성해줘. 마크다운 코드 블록(```) 없이 오직 코드 텍스트만 반환해줘.';
        }
        if (textOutputEntry) addThinkingLog(npc.id, { type: 'system', content: '참고 문서(피드백)를 전달받았습니다. 작업을 시작합니다.' });
      }

      if (sourceId) setActiveConnection({ source: sourceId, target: npc.id });
      if (linkedTask) {
        userPrompt = `[특별 지시사항 (칸반 보드)]\n사용자가 다음 칸반 작업을 할당했습니다: "${linkedTask.title}"\n위 작업에 맞춰 당신의 역할을 수행해줘.\n\n` + userPrompt;
        message = `칸반 작업 수행 중... 🚀`;
      }
      setGeneratingMessage(message);

      // 작업자 및 협업 대상자를 화이트보드로 이동 고정
      setNpcs(curr => curr.map(n => {
        if (n.id === npc.id) return { ...n, isBusy: true, x: sourceId ? 65 : 50, y: 50 };
        if (sourceId && n.id === sourceId) return { ...n, isBusy: true, x: 35, y: 50 };
        return n;
      }));

      await new Promise(r => setTimeout(r, 300));
      addThinkingLog(npc.id, { type: 'user', content: `[User Prompt] ${userPrompt.substring(0, 150)}...` });
      await new Promise(r => setTimeout(r, 500));

      // Human-in-the-Loop: 작업 진행 전 승인 절차
      setGeneratingMessage('사용자 결재 대기 중 ✋');
      addThinkingLog(npc.id, { type: 'system', content: '사용자 승인(Human-in-the-Loop) 대기 중...' });
      
      const isApproved = await new Promise((resolve) => {
        setApprovalReq({ npc, prompt: userPrompt, resolve });
      });
      setApprovalReq(null);

      if (!isApproved) {
        addThinkingLog(npc.id, { type: 'system', content: '작업이 반려되어 칸반 보드에서 제거됩니다.' });
        setToastMessage(`[${npc.name}]님의 작업이 반려되어 제거되었습니다.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '작업 반려됨 🛑' } : n));
        if (linkedTask) setTasks(prev => prev.filter(t => t.id !== linkedTask.id));
        return;
      }

      addThinkingLog(npc.id, { type: 'system', content: '작업 승인됨. 모델 호출을 시작합니다.' });
      setGeneratingMessage(message); // 원래 메시지로 복구
      
      addThinkingLog(npc.id, { type: 'system', content: `AI 모델 [${npc.model}] 호출을 시작합니다... (스트리밍)` });
      addThinkingLog(npc.id, { type: 'ai', content: '' }); // AI 응답을 채워넣을 빈 로그 추가

      try {
        let generatedText = await callLLM(apiKey, npc.model, systemPrompt, userPrompt, handleChunk);

        // 마크다운 백틱(```) 제거 방어 로직 (순수 코드만 남기기 위함)
        if (npc.specialty === 'code') {
          generatedText = generatedText.replace(/```[\w]*\n/g, '').replace(/```/g, '').trim();
        }

        output = { type: npc.specialty, content: generatedText };
        addThinkingLog(npc.id, { type: 'system', content: '모델 응답 스트림이 종료되었습니다. 결과물을 정리합니다.' });
      } catch (error) {
        console.error('LLM API Error:', error);
        alert(`텍스트/코드 생성 실패: ${error.message}`);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false } : n));
        if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'todo', assignee: null } : t));
        return;
      }
    } else if (npc.specialty === 'image') {
      // 개별 API 키 우선 적용, 없으면 전역 Image 키, 없으면 전역 LLM 키 사용
      const apiKey = npc.apiKey || apiKeys.image || apiKeys.openai || apiKeys.llm; 
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
      if (linkedTask) {
        message = `칸반 이미지 작업 렌더링 중... 🚀`;
      }
      
      if (sourceId) setActiveConnection({ source: sourceId, target: npc.id });
      setGeneratingMessage(message);

      // 작업자 및 협업 대상자를 화이트보드로 이동 고정
      setNpcs(curr => curr.map(n => {
        if (n.id === npc.id) return { ...n, isBusy: true, x: sourceId ? 65 : 50, y: 50 };
        if (sourceId && n.id === sourceId) return { ...n, isBusy: true, x: 35, y: 50 };
        return n;
      }));

      // 박팀장의 기획안 결과물이 있다면 이를 포함하여 프롬프트 작성
      let userPrompt = linkedTask ? linkedTask.title : "IT 서비스에 어울리는 트렌디하고 세련된 브랜드 로고나 일러스트를 그려줘. 깔끔하고 직관적인 디자인으로.";
      if (mediaOutputs[1]) {
        userPrompt += `\n\n다음 기획안 컨셉을 적극 반영해줘:\n${mediaOutputs[1].content}`;
      }

      // Human-in-the-Loop 컨펌
      setGeneratingMessage('사용자 결재 대기 중 ✋');
      const isApproved = await new Promise((resolve) => {
        setApprovalReq({ npc, prompt: userPrompt, resolve });
      });
      setApprovalReq(null);

      if (!isApproved) {
        setToastMessage(`[${npc.name}]님의 작업이 반려되어 제거되었습니다.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '작업 반려됨 🛑' } : n));
        if (linkedTask) setTasks(prev => prev.filter(t => t.id !== linkedTask.id));
        return;
      }
      setGeneratingMessage(message);

      try {
        const imageUrl = await callImageGen(apiKey, userPrompt);
        output = { type: 'image', content: imageUrl };
      } catch (error) {
        console.error('DALL-E 3 Error:', error);
        alert(`이미지 생성 실패: ${error.message}`);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false } : n));
        if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'todo', assignee: null } : t));
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
      if (linkedTask) {
        message = `칸반 영상 작업 렌더링 중... 🚀`;
      }
      output = { type: 'video', content: 'https://www.w3schools.com/html/mov_bbb.mp4' };
      
      if (sourceId) setActiveConnection({ source: sourceId, target: npc.id });
      setGeneratingMessage(message);

      // 작업자 및 협업 대상자를 화이트보드로 이동 고정
      setNpcs(curr => curr.map(n => {
        if (n.id === npc.id) return { ...n, isBusy: true, x: sourceId ? 65 : 50, y: 50 };
        if (sourceId && n.id === sourceId) return { ...n, isBusy: true, x: 35, y: 50 };
        return n;
      }));
    }

    // API를 호출하지 않는 영상 작업만 기존처럼 2.5초 지연을 두어 시뮬레이션
    if (npc.specialty === 'video') {
      await new Promise(resolve => setTimeout(resolve, 2500));
      try {
        const apiKey = npc.apiKey || apiKeys.video || apiKeys.openai || apiKeys.llm;
        if (!apiKey) {
          alert('Video API 키가 설정되지 않았습니다. 설정 모달에서 Video API 키를 입력해주세요.');
          setGeneratingId(null);
          setActiveConnection(null);
          setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false } : n));
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
        
        if (linkedTask) requestBody.prompt = linkedTask.title;

        // Human-in-the-Loop 컨펌
        setGeneratingMessage('사용자 결재 대기 중 ✋');
        const isApproved = await new Promise((resolve) => {
          setApprovalReq({ npc, prompt: requestBody.prompt, resolve });
        });
        setApprovalReq(null);

        if (!isApproved) {
          setToastMessage(`[${npc.name}]님의 작업이 반려되어 제거되었습니다.`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          setGeneratingId(null);
          setActiveConnection(null);
          setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '작업 반려됨 🛑' } : n));
          if (linkedTask) setTasks(prev => prev.filter(t => t.id !== linkedTask.id));
          return;
        }
        setGeneratingMessage(message);

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
            setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false } : n));
            if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'todo', assignee: null } : t));
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
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false } : n));
        if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'todo', assignee: null } : t));
        return;
      }
    }

    setGeneratingId(null);
    setActiveConnection(null); // 작업이 완료되면 연결선 해제
    
    // 기존 결과물 닫기 타임아웃이 있다면 제거 (연속 작업 시 방어 로직)
    if (mediaOutputTimeouts.current[npc.id]) {
      clearTimeout(mediaOutputTimeouts.current[npc.id]);
    }
    
    setMediaOutputs(prev => ({ ...prev, [npc.id]: output }));

    // 10초 뒤에 결과물 말풍선 자동 닫기
    mediaOutputTimeouts.current[npc.id] = setTimeout(() => {
      setMediaOutputs(prev => { const next = { ...prev }; delete next[npc.id]; return next; });
    }, 10000);

    // 활동 로그 추가 유도 및 화이트보드 고정(isBusy) 해제
    setNpcs(curr => curr.map(n => {
      if (n.id === npc.id) return { ...n, status: completionStatus, isBusy: false };
      if (sourceId && n.id === sourceId) return { ...n, isBusy: false };
      return n;
    }));

    // 칸반 작업 완료 처리
    if (linkedTask) {
      setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'done' } : t));

      // 상호 피드백(핑퐁) 꼬리물기 태스크 자동 생성 로직
      const baseTitle = linkedTask.title.replace(/\[.*?\]\s*/g, ''); // [태그] 제거
      
      // 무한 루프를 방지하기 위해 [반영] 단계까지만 진행
      if (!linkedTask.title.includes('[반영]')) {
        let nextSpecialty = null;
        let nextTitle = '';

        if (npc.specialty === 'code' && !linkedTask.title.includes('[리뷰]')) {
          nextTitle = `[리뷰] ${baseTitle} 코드 피드백 및 추가 기능 제안`;
          nextSpecialty = 'text';
        } else if (npc.specialty === 'image' && !linkedTask.title.includes('[리뷰]')) {
          nextTitle = `[리뷰] ${baseTitle} 디자인 검토 및 개선점 제안`;
          nextSpecialty = 'text';
        } else if (npc.specialty === 'text' && linkedTask.title.includes('[리뷰]')) {
          nextTitle = `[반영] ${baseTitle} 피드백 기반 코드/기능 수정`;
          nextSpecialty = 'code';
        }

        if (nextTitle && nextSpecialty) {
          setTimeout(() => {
            setTasks(prev => [...prev, {
              id: Date.now() + Math.random(),
              title: nextTitle,
              specialty: nextSpecialty,
              status: 'todo',
              assignee: null
            }]);
          }, 2000); // 2초 뒤 자연스럽게 칸반에 등록
        }
      }
    }
    
    // 폭죽 효과 트리거 (1.5초 후 자동 제거)
    setConfettiId(npc.id);
    setTimeout(() => {
      setConfettiId(curr => curr === npc.id ? null : curr);
    }, 1500);

    // 작업 완료 토스트 알림 띄우기
    setToastMessage(`[${npc.name}] ${completionStatus}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // 웹훅으로 결과 전송
    handleWebhookNotifications(npc, output);
  };

  // 웹훅 알림 통합 핸들러
  const handleWebhookNotifications = (npc, output) => {
    sendToSlack(apiKeys.slackWebhookUrl, npc, output);
    sendToDiscord(apiKeys.discordWebhookUrl, npc, output);
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
      const draggedId = draggingIdRef.current;
      const draggedNpc = npcs.find(n => n.id === draggedId);
      
      let targetNpc = null;
      if (draggedNpc) {
        // 드래그한 NPC와 다른 NPC 간의 거리 계산 (유클리드 거리 6% 이내면 충돌로 간주)
        targetNpc = npcs.find(n => 
          n.id !== draggedId && 
          !n.isBusy && // 작업 중이거나 이미 대화 중인 NPC는 방해하지 않음
          Math.hypot(n.x - draggedNpc.x, n.y - draggedNpc.y) < 6
        );
      }

      if (targetNpc) {
        const topics = ['코드 아키텍처', 'UI/UX 디자인', '오늘 점심 메뉴', '새로운 AI 트렌드', '프로젝트 일정'];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        
        const emojis = ['💖', '❗', '💡', '✨', '🔥', '👀', '🤔', '💬'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const newX = targetNpc.x > 50 ? targetNpc.x - 7 : targetNpc.x + 7;

        setNpcs((currentNpcs) => 
          currentNpcs.map(npc => {
            if (npc.id === draggedId) {
              // 화면 밖으로 나가지 않도록 타겟의 위치에 따라 좌/우로 나란히 배치
              return { ...npc, x: newX, y: targetNpc.y, status: `🗣️ "${topic} 논의할까요?"`, isBusy: true };
            }
            if (npc.id === targetNpc.id) {
              return { ...npc, status: `💬 "좋아요! ${topic} 이야기해봐요."`, isBusy: true };
            }
            return npc;
          })
        );

        // 두 에이전트 중앙에 이모지 표시
        setInteractionEmoji({ x: (newX + targetNpc.x) / 2, y: targetNpc.y - 12, emoji: randomEmoji });

        // 5초 후 대화 상태(isBusy) 해제 및 일상으로 복귀
        setTimeout(() => {
          setNpcs(current => current.map(n => 
            (n.id === draggedId || n.id === targetNpc.id) ? { ...n, isBusy: false, status: '대화 종료 👋' } : n
          ));
          setInteractionEmoji(null);
        }, 5000);

        setToastMessage(`${draggedNpc.name}님과 ${targetNpc.name}님이 대화를 시작했습니다! 💬`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setNpcs((currentNpcs) =>
          currentNpcs.map((npc) =>
            npc.id === draggedId ? { ...npc, status: '새로운 위치로 이동 완료 📍' } : npc
          )
        );
      }
    }
    setDraggingId(null);
    draggingIdRef.current = null;
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-200 font-sans relative">
      {/* 폭죽 애니메이션을 위한 글로벌 스타일 */}
      <style>{`
        @keyframes explode {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(720deg) scale(0); opacity: 0; }
        }
        @keyframes floatEmoji {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -15px) scale(1.2); opacity: 1; }
          80% { transform: translate(-50%, -35px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50px) scale(0.8); opacity: 0; }
        }
      `}</style>

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
              <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-700">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-1"><Bot className="w-4 h-4 text-emerald-400" /> LLM (텍스트/코드) API 키</label>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> OpenAI (ChatGPT)
                  </label>
                  <input 
                    type="password"
                    value={apiKeys.openai || ''}
                    onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                    className="w-full bg-slate-900/80 text-white border border-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner text-sm placeholder:text-slate-600"
                    placeholder="sk-proj-..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Anthropic (Claude)
                  </label>
                  <input 
                    type="password"
                    value={apiKeys.anthropic || ''}
                    onChange={(e) => setApiKeys({...apiKeys, anthropic: e.target.value})}
                    className="w-full bg-slate-900/80 text-white border border-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner text-sm placeholder:text-slate-600"
                    placeholder="sk-ant-..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Google (Gemini)
                  </label>
                  <input 
                    type="password"
                    value={apiKeys.gemini || ''}
                    onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                    className="w-full bg-slate-900/80 text-white border border-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner text-sm placeholder:text-slate-600"
                    placeholder="AIzaSy..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-100"></div> xAI (Grok)
                  </label>
                  <input 
                    type="password"
                    value={apiKeys.grok || ''}
                    onChange={(e) => setApiKeys({...apiKeys, grok: e.target.value})}
                    className="w-full bg-slate-900/80 text-white border border-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all shadow-inner text-sm placeholder:text-slate-600"
                    placeholder="xai-..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div> DeepSeek
                  </label>
                  <input 
                    type="password"
                    value={apiKeys.deepseek || ''}
                    onChange={(e) => setApiKeys({...apiKeys, deepseek: e.target.value})}
                    className="w-full bg-slate-900/80 text-white border border-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all shadow-inner text-sm placeholder:text-slate-600"
                    placeholder="sk-..."
                  />
                </div>
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

      {/* Human-in-the-Loop 결재 모달 */}
      {approvalReq && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-indigo-500/50 rounded-2xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${approvalReq.npc.color}`}>
                {React.createElement(approvalReq.npc.icon || User, { className: "w-5 h-5 text-white" })}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">결재 대기 중 ✋</h3>
                <p className="text-xs text-slate-400">{approvalReq.npc.name}님이 진행 승인을 요청합니다.</p>
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 mb-6 max-h-48 overflow-y-auto">
              <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">작업 내용 (프롬프트)</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{approvalReq.prompt}</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => approvalReq.resolve(false)}
                className="flex-1 py-2.5 rounded-xl font-bold border border-slate-600 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50 transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" /> 반려 (Cancel)
              </button>
              <button 
                onClick={() => approvalReq.resolve(true)}
                className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" /> 승인 (Proceed)
              </button>
            </div>
          </div>
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
          
          {/* Auto Mode 홀로그램 배경 시각화 */}
          {isAutoMode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-80">
              <span 
                className="text-[10vw] font-black text-emerald-500/10 tracking-[0.3em] uppercase select-none animate-pulse"
                style={{ textShadow: '0 0 60px rgba(52, 211, 153, 0.4), 0 0 120px rgba(52, 211, 153, 0.2)' }}
              >
                AUTO MODE
              </span>
            </div>
          )}
          
          {/* 화이트보드 (협업 존) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-48 bg-slate-800/40 border border-slate-600/50 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none z-0 shadow-2xl">
            <div className="w-56 h-28 border border-slate-500/50 bg-slate-900/50 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner">
               <div className="absolute top-2 left-2 flex gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-rose-400/70"></div>
                 <div className="w-2 h-2 rounded-full bg-amber-400/70"></div>
                 <div className="w-2 h-2 rounded-full bg-emerald-400/70"></div>
               </div>
               <span className="text-slate-500/50 font-black tracking-widest text-2xl uppercase">WHITEBOARD</span>
            </div>
            <div className="absolute bottom-3 text-xs text-slate-400 font-semibold tracking-wide">Collaboration Zone</div>
          </div>

          {/* 칸반 보드 (Kanban Board) UI */}
          <div className="absolute top-6 right-6 w-72 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl z-20 flex flex-col max-h-[60%] overflow-hidden pointer-events-none group hover:pointer-events-auto transition-all opacity-80 hover:opacity-100">
            <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-indigo-400" /> Task Board
              </span>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="relative group bg-slate-800/90 border border-slate-600 p-2.5 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-300 break-words flex-1 pr-4 leading-tight">{task.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      task.status === 'todo' ? 'bg-slate-700 text-slate-400' :
                      task.status === 'in-progress' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {task.status === 'in-progress' ? `WIP: ${task.assignee}` : task.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      {task.specialty === 'image' ? <Palette className="w-3 h-3"/> : task.specialty === 'code' ? <Code className="w-3 h-3"/> : task.specialty === 'video' ? <Video className="w-3 h-3"/> : <FileText className="w-3 h-3"/>}
                      {task.specialty.toUpperCase()}
                    </span>
                    {task.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="absolute top-1 right-1 p-0.5 text-slate-500 hover:text-red-400 bg-slate-800/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="작업 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-xs text-slate-500 text-center py-4">등록된 작업이 없습니다.</p>}
            </div>
          </div>

          {/* 대화 시 떠오르는 이모지 시각화 */}
          {interactionEmoji && (
            <div
              className="absolute pointer-events-none z-40 text-4xl drop-shadow-lg"
              style={{
                left: `${interactionEmoji.x}%`,
                top: `${interactionEmoji.y}%`,
                animation: 'floatEmoji 2.5s ease-in-out infinite'
              }}
            >
              {interactionEmoji.emoji}
            </div>
          )}

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
                {/* 생각 중(작업 중) 타이핑 애니메이션 생각풍선 */}
                {generatingId === npc.id && (
                  <div className="absolute bottom-[115px] flex flex-col items-center z-30 pointer-events-none drop-shadow-md">
                    <div className="bg-white px-4 py-3 rounded-full shadow-sm border border-slate-200 flex items-center justify-center gap-1.5 min-w-[60px]">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    {/* 생각 풍선 꼬리 (작은 원 두 개) */}
                    <div className="flex flex-col mt-1 gap-1 -ml-6">
                      <div className="w-2.5 h-2.5 bg-white rounded-full border border-slate-200 shadow-sm"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full border border-slate-200 shadow-sm ml-2"></div>
                    </div>
                  </div>
                )}

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
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          if (mediaOutputTimeouts.current[npc.id]) clearTimeout(mediaOutputTimeouts.current[npc.id]);
                          setMediaOutputs(prev => { const n = {...prev}; delete n[npc.id]; return n; }) 
                        }} className="text-slate-500 hover:text-red-400 transition-colors">
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

                {/* 평상시 상태 메시지 말풍선 */}
                {!mediaOutputs[npc.id] && generatingId !== npc.id && npc.status && (
                  <div className="absolute bottom-16 flex flex-col items-center z-30 opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none drop-shadow-md">
                    <div className="bg-white text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-2xl shadow-sm whitespace-nowrap border border-slate-200">
                      {npc.status}
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-5 border-t-white -mt-[1px]"></div>
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

                {/* 폭죽 (Confetti) 효과 */}
                {confettiId === npc.id && (
                  <div className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none z-50">
                    {[...Array(20)].map((_, i) => {
                      // 무작위 각도와 거리 계산
                      const angle = (i * 360) / 20;
                      const distance = 50 + Math.random() * 60; // 50px ~ 110px
                      const tx = `${Math.cos(angle * Math.PI / 180) * distance}px`;
                      const ty = `${Math.sin(angle * Math.PI / 180) * distance}px`;
                      const colors = ['bg-rose-500', 'bg-blue-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-purple-500'];
                      const color = colors[i % colors.length];
                      return (
                        <div
                          key={i}
                          className={`absolute w-2.5 h-2.5 ${color} rounded-sm opacity-0`}
                          style={{
                            '--tx': tx,
                            '--ty': ty,
                            animation: 'explode 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards'
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 하단 글로벌 커맨드 입력 바 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl z-20">
            <form onSubmit={handleCommandSubmit} className="relative flex items-center shadow-2xl group">
              <MessageCircle className="absolute left-5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                placeholder="업무를 지시하세요 (예: 로그인 페이지 디자인해줘, 리액트 코드 작성해 등)"
                className="w-full bg-slate-900/95 backdrop-blur-md text-white border border-slate-600 rounded-full pl-12 pr-14 py-4 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] transition-all font-medium text-sm"
              />
              <button 
                type="submit"
                disabled={!commandInput.trim()}
                className="absolute right-2.5 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-full transition-colors shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
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
              onClick={() => {
                setIsAutoMode(!isAutoMode);
                setToastMessage(!isAutoMode ? '24/7 Auto Mode 활성화! 🤖 연속 자동 작업을 시작합니다.' : 'Auto Mode 비활성화 🛑');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }}
              className={`p-2 rounded-lg transition-colors ${isAutoMode ? 'text-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title={isAutoMode ? "Auto Mode 끄기" : "Auto Mode 켜기 (24/7 연속 자동 작업)"}
            >
              <Bot className="w-5 h-5" />
            </button>
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
                    {(editingAgent.specialty === 'text' || editingAgent.specialty === 'code') ? (
                      <select
                        value={editingAgent.model}
                        onChange={(e) => setEditingAgent({...editingAgent, model: e.target.value})}
                        className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        {availableLLMModels.map(modelName => (
                          <option key={modelName} value={modelName}>{modelName}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text"
                        value={editingAgent.model} 
                        onChange={(e) => setEditingAgent({...editingAgent, model: e.target.value})}
                        className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="예: dall-e-3"
                      />
                    )}
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
          {/* 탭 헤더 */}
          <div className="px-5 pt-3 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveLogTab('logs')} className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${activeLogTab === 'logs' ? 'text-slate-200 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                <History className="w-4 h-4" />
                Activity Logs
              </button>
              <button onClick={() => setActiveLogTab('thinking')} className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${activeLogTab === 'thinking' ? 'text-slate-200 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                <BrainCircuit className="w-4 h-4" />
                Thinking Process
              </button>
            </div>
            <div className="flex items-center gap-2">
              {activeLogTab === 'logs' && (
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 shadow-inner">
                  {logs.length}
                </span>
              )}
              <button
                onClick={() => {
                  if (activeLogTab === 'logs') {
                    setLogs([]);
                  } else if (activeLogTab === 'thinking' && selectedId) {
                    setThinkingLogs(prev => ({ ...prev, [selectedId]: [] }));
                  }
                }}
                className="p-1 text-slate-500 hover:text-red-400 disabled:text-slate-600 disabled:cursor-not-allowed hover:bg-slate-700 rounded-md transition-colors"
                title={activeLogTab === 'logs' ? "로그 초기화" : "생각 일지 초기화"}
                disabled={(activeLogTab === 'logs' && logs.length === 0) || (activeLogTab === 'thinking' && (!selectedId || !thinkingLogs[selectedId] || thinkingLogs[selectedId].length === 0))}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* 탭 컨텐츠 */}
          {activeLogTab === 'logs' && (
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
          )}
          {activeLogTab === 'thinking' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
              {selectedNPC && thinkingLogs[selectedNPC.id] && thinkingLogs[selectedNPC.id].length > 0 ? (
                thinkingLogs[selectedNPC.id].map((log, index) => (
                  <div key={index} className="flex items-start gap-3 animate-fade-in">
                    <span className="text-slate-600 select-none">{log.time}</span>
                    {log.type === 'system' && <span className="text-purple-400 font-bold select-none">[SYSTEM]</span>}
                    {log.type === 'user' && <span className="text-blue-400 font-bold select-none">[USER]</span>}
                    {log.type === 'ai' && <span className="text-emerald-400 font-bold select-none">[AI]</span>}
                    <p className="text-slate-300 whitespace-pre-wrap flex-1 leading-relaxed">{log.content || '...'}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3 text-center">
                  <BrainCircuit className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-sans">
                    {selectedNPC ? `[${selectedNPC.name}]에게 작업을 지시하면 이곳에 생각의 흐름이 표시됩니다.` : '에이전트를 선택하고 작업을 지시해주세요.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}