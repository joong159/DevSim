import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Cpu,
  Activity,
  Settings,
  Code,
  Terminal,
  Palette,
  Database,
  Globe,
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
  Eye,
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
  MessageCircle,
  TrendingUp,
  Box,
  Monitor,
  FileCode,
  Music,
  Headphones
} from 'lucide-react';
import { callLLM, callImageGen, callVideoGen, callAudioGen } from './api';
import { sendToSlack, sendToDiscord } from './webhook';

// 직군(특기)별 사용 가능한 API 및 모델 목록
const modelOptions = {
  text: [
    { value: 'gpt-4o', label: 'OpenAI (GPT-4o)' },
    { value: 'gpt-4-turbo', label: 'OpenAI (GPT-4 Turbo)' },
    { value: 'claude-3-5-sonnet-20240620', label: 'Anthropic (Claude 3.5 Sonnet)' },
    { value: 'claude-3-opus-20240229', label: 'Anthropic (Claude 3 Opus)' },
    { value: 'gemini-1.5-pro', label: 'Google (Gemini 1.5 Pro)' },
    { value: 'gemini-1.5-pro-latest', label: 'Google (Gemini 1.5 Pro)' },
    { value: 'grok-beta', label: 'xAI (Grok Beta)' },
    { value: 'deepseek-chat', label: 'DeepSeek Chat' }
  ],
  code: [
    { value: 'gpt-4o', label: 'OpenAI (GPT-4o)' },
    { value: 'claude-3-5-sonnet-20240620', label: 'Anthropic (Claude 3.5 Sonnet)' },
    { value: 'gemini-1.5-pro', label: 'Google (Gemini 1.5 Pro)' },
    { value: 'gemini-1.5-pro-latest', label: 'Google (Gemini 1.5 Pro)' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' }
  ],
  image: [
    { value: 'dall-e-3', label: 'OpenAI (DALL-E 3)' },
    { value: 'stable-diffusion-v3', label: 'Stability AI (SD 3)' },
    { value: 'midjourney', label: 'Midjourney' }
  ],
  video: [
    { value: 'luma-dream-machine', label: 'Luma AI (Dream Machine)' },
    { value: 'runway-gen3', label: 'Runway (Gen-3)' }
  ],
  audio: [
    { value: 'tts-1', label: 'OpenAI (TTS-1)' },
    { value: 'tts-1-hd', label: 'OpenAI (TTS-1-HD)' }
  ]
};

// 브라우저에서 코드를 실행 가능한 HTML로 감싸주는 헬퍼 함수
const getPreviewHtml = (code) => {
  if (code.toLowerCase().includes('<!doctype html>') || code.toLowerCase().includes('<html')) {
    return code; // 이미 완전한 HTML 문서라면 그대로 반환
  }
  if (code.includes('import React') || code.includes('export default') || code.includes('className=')) {
    // React 컴포넌트일 경우 Babel과 React 라이브러리를 주입하여 실행
    const cleanCode = code
      .replace(/import\s+.*?\s+from\s+['"].*?['"];?/g, '')
      .replace(/export\s+default\s+(function|class|const|let|var)\s+(\w+)/g, 'const $2 =')
      .replace(/export\s+default\s+(\w+);?/g, '');
      
    const componentMatch = cleanCode.match(/(?:function|const|let|var)\s+([A-Z]\w*)/);
    const componentName = componentMatch ? componentMatch[1] : 'App';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${cleanCode}
    
    if (typeof ${componentName} !== 'undefined') {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<${componentName} />);
    }
  </script>
</body>
</html>`;
  }
  // 알 수 없는 일반 텍스트나 로직 코드일 경우 <pre> 로 단순 렌더링
  return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#1e1e1e] text-emerald-400 p-6 font-mono text-sm"><pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></body></html>`;
};

// 초기 NPC 데이터 구성 (특기 및 미디어 역할군 부여 - 2026년 모델 적용)
const initialNPCs = [
  { id: 1, name: '박팀장', role: 'Project Manager', specialty: 'text', model: 'gpt-4o', apiKey: '', persona: '당신은 10년 차 IT 프로젝트 매니저입니다. 항상 일정을 준수하고 명확하게 소통합니다.', x: 20, y: 30, color: 'bg-blue-500', icon: FileText, status: '휴식 중... ☕' },
  { id: 2, name: '김개발', role: 'Software Engineer', specialty: 'code', model: 'claude-3-5-sonnet-20240620', apiKey: '', persona: '당신은 시니어 프론트엔드 개발자입니다. 클린 코드와 성능 최적화를 중요하게 생각합니다.', x: 60, y: 25, color: 'bg-green-500', icon: Code, status: '휴식 중... ☕' },
  { id: 3, name: '이픽셀', role: 'UI/UX Designer', specialty: 'image', model: 'stable-diffusion-v3', apiKey: '', persona: '당신은 트렌디한 감각을 지닌 UI/UX 디자이너입니다. 사용자 경험을 최우선으로 고려합니다.', x: 75, y: 65, color: 'bg-purple-500', icon: Palette, status: '휴식 중... ☕' },
  { id: 4, name: '강무비', role: 'Video Creator', specialty: 'video', model: 'luma-dream-machine', apiKey: '', persona: '당신은 감각적인 영상 편집자입니다. 시선을 사로잡는 트랜지션과 효과를 잘 사용합니다.', x: 30, y: 70, color: 'bg-rose-500', icon: Video, status: '휴식 중... ☕' },
  { id: 5, name: '사운드최', role: 'Audio Director', specialty: 'audio', model: 'tts-1', apiKey: '', persona: '당신은 텍스트를 감미로운 음성으로 변환하는 오디오 엔지니어입니다.', x: 45, y: 85, color: 'bg-amber-500', icon: Music, status: '휴식 중... ☕' },
];

// 무작위로 변경될 상태 메시지 목록
const statusMessages = [
  '코드 리뷰 중... 🧐',
  '문서 작성 중 📝',
  '다음 작업 대기 중 ⏳',
  '업무 로직 구상 중 💡',
  '자료 리서치 중 🔍'
];

// Tailwind 배경색을 SVG 선 그라데이션용 Hex 색상으로 변환하는 매핑 객체
const twColorToHex = {
  'bg-blue-500': '#3b82f6',
  'bg-green-500': '#22c55e',
  'bg-purple-500': '#a855f7',
  'bg-rose-500': '#f43f5e',
  'bg-yellow-500': '#eab308',
  'bg-teal-500': '#14b8a6',
  'bg-orange-500': '#f97316',
  'bg-cyan-500': '#06b6d4',
  'bg-lime-500': '#84cc16',
  'bg-pink-500': '#ec4899'
};

export default function DevSim() {
  const [selectedId, setSelectedId] = useState(null);
  const [npcs, setNpcs] = useState(initialNPCs);
  const [draggingId, setDraggingId] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // 멀티모달 확장 기능 State
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeys, setApiKeys] = useState({ openai: '', anthropic: '', gemini: '', grok: '', deepseek: '', llm: '', image: '', imageBaseUrl: '', video: '', audio: '', slackWebhookUrl: '', discordWebhookUrl: '' });
  const [generatingId, setGeneratingId] = useState(null);
  const [mediaOutputs, setMediaOutputs] = useState({});
  const [generatingMessage, setGeneratingMessage] = useState('');
  const [activeConnection, setActiveConnection] = useState(null); // 에이전트 간 협업 시각화를 위한 연결 상태
  const [viewingImage, setViewingImage] = useState(null);
  const [viewingVideo, setViewingVideo] = useState(null);
  const [viewingCode, setViewingCode] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [apiUsage, setApiUsage] = useState({ text: 0, code: 0, image: 0, video: 0 });

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
  const [meetingLogs, setMeetingLogs] = useState([]); // 에이전트 간 회의(대화) 기록
  
  // 챗봇 기능 State (로컬 스토리지 연동)
  const [chatNpcId, setChatNpcId] = useState(null);
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('devsim_chatHistory');
    return saved ? JSON.parse(saved) : {};
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatScrollRef = useRef(null);

  // 신규 진화 기능 State (로컬 스토리지 연동)
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('devsim_tasks');
    return saved ? JSON.parse(saved) : [{ id: 1, title: 'DevSim 랜딩 페이지 기획서 초안 작성', specialty: 'text', status: 'todo', assignee: null }];
  });
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

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, chatNpcId]);

  // 칸반 보드 및 1:1 대화 내용 자동 저장
  useEffect(() => {
    localStorage.setItem('devsim_tasks', JSON.stringify(tasks));
  }, [tasks]);
  
  useEffect(() => {
    localStorage.setItem('devsim_chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const officeRef = useRef(null);
  const draggingIdRef = useRef(null);
  const prevNpcsRef = useRef(initialNPCs);
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

    const savedUsage = localStorage.getItem('devsim_usage');
    if (savedUsage) {
      try {
        setApiUsage(JSON.parse(savedUsage));
      } catch(e) {}
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
    const trimmedKeys = Object.fromEntries(
      Object.entries(apiKeys).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
    );
    setApiKeys(trimmedKeys);
    localStorage.setItem('devsim_keys', JSON.stringify(trimmedKeys));
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
    
    const agentToSave = { 
      ...editingAgent, 
      apiKey: (editingAgent.apiKey || '').trim(),
      baseUrl: (editingAgent.baseUrl || '').trim().replace(/\/$/, '')
    };
    const updatedNpcs = npcs.map(n => n.id === editingAgent.id ? { ...n, ...agentToSave } : n);
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

  // 평상시 무작위 상태 변경을 위한 Effect Hook (이동 제거)
  useEffect(() => {
    if (isPaused) return; // 일시정지 상태면 건너뜀

    const interval = setInterval(() => {
      setNpcs((currentNpcs) =>
        currentNpcs.map((npc) => {
          // 드래그 중이거나 작업 중(isBusy)인 NPC는 스킵
          if (npc.id === draggingIdRef.current || npc.isBusy) return npc;

          // 무작위 상태 선택
          const newStatus = statusMessages[Math.floor(Math.random() * statusMessages.length)];
          
          return { ...npc, status: newStatus }; // 위치(x, y)는 변경하지 않고 가만히 둠
        })
      );
      }, 5000); // 5초 간격으로 상태 메시지만 변경

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleReset = () => {
    Object.values(mediaOutputTimeouts.current).forEach(clearTimeout);
    mediaOutputTimeouts.current = {};
    setNpcs(initialNPCs);
    localStorage.removeItem('devsim_agents');
    localStorage.removeItem('devsim_tasks');
    localStorage.removeItem('devsim_chatHistory');
    setLogs([]);
    setSelectedId(null);
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
    setMeetingLogs([]);
    setChatNpcId(null);
    setChatHistory({});
    setChatInput('');
  };

  // 에이전트 1:1 채팅 전송 핸들러
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;

    const chatNpc = npcs.find(n => n.id === chatNpcId);
    if (!chatNpc) return;

    let globalKey = apiKeys.llm;
    let actualModel = chatNpc.model;
    const modelName = actualModel.toLowerCase();
    
    if (modelName.includes('claude')) globalKey = apiKeys.anthropic || apiKeys.llm;
    else if (modelName.includes('gemini')) globalKey = apiKeys.gemini || apiKeys.llm;
    else if (modelName.includes('grok')) globalKey = apiKeys.grok || apiKeys.llm;
    else if (modelName.includes('deepseek')) globalKey = apiKeys.deepseek || apiKeys.llm;
    else if (modelName.includes('gpt') || modelName.includes('o1')) globalKey = apiKeys.openai || apiKeys.llm;

    let apiKey = (chatNpc.apiKey || globalKey || '').trim();

    if (!apiKey && !chatNpc.apiKey) {
      if (apiKeys.gemini) { apiKey = apiKeys.gemini; actualModel = 'gemini-1.5-pro-latest'; }
      else if (apiKeys.anthropic) { apiKey = apiKeys.anthropic; actualModel = 'claude-3-5-sonnet-20240620'; }
      else if (apiKeys.openai) { apiKey = apiKeys.openai; actualModel = 'gpt-4o'; }
      else if (apiKeys.grok) { apiKey = apiKeys.grok; actualModel = 'grok-beta'; }
      else if (apiKeys.deepseek) { apiKey = apiKeys.deepseek; actualModel = 'deepseek-chat'; }
    }

    if (!apiKey) {
      setToastMessage(`[${actualModel}] 모델을 위한 API 키가 설정되지 않았습니다.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (!/^[\x00-\x7F]*$/.test(apiKey)) {
      setToastMessage(`[${actualModel}] API 키에 유효하지 않은 문자(한글/공백 등)가 포함되어 있습니다.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const currentInput = chatInput;
    setChatInput('');
    setIsChatTyping(true);

    setChatHistory(prev => ({
      ...prev,
      [chatNpcId]: [...(prev[chatNpcId] || []), { role: 'user', content: currentInput }, { role: 'assistant', content: '' }]
    }));

    const previousChat = chatHistory[chatNpcId] || [];
    const historyText = previousChat.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const fullPrompt = historyText ? `이전 대화:\n${historyText}\n\n사용자: ${currentInput}` : currentInput;
    
    try {
      const baseUrl = (chatNpc.baseUrl || '').trim();
      await callLLM(apiKey, actualModel, chatNpc.persona || '당신은 도움이 되는 AI 어시스턴트입니다.', fullPrompt, (chunk) => {
        setChatHistory(prev => {
          const hist = prev[chatNpcId];
          if (!hist || hist.length === 0) return prev;
          const lastMsg = hist[hist.length - 1];
          return {
            ...prev,
            [chatNpcId]: [...hist.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunk }]
          };
        });
      }, baseUrl);
    } catch (err) {
      setToastMessage(`채팅 에러: ${err.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsChatTyping(false);
    }
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
        } else if (output.type === 'audio') {
          markdown += `🎵 오디오 결과물 (음성 파일 생성됨)\n\n`;
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

  // 에이전트 회의록 내보내기 (.txt)
  const handleExportMeetings = () => {
    if (meetingLogs.length === 0) {
      setToastMessage('저장할 회의 기록이 없습니다. 에이전트들을 드래그해서 만나게 해보세요! 😅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const textContent = `# DevSim Agent Meeting Logs\n\n` + meetingLogs.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DevSim_Meetings_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setToastMessage('회의 기록이 텍스트 파일로 다운로드되었습니다 📥');
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
    else if (commandInput.match(/음성|오디오|목소리|읽어줘|TTS/)) specialty = 'audio';

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

    // [신규 기능] 방치형 무한 루프: 오토 모드인데 할 일이 없으면 PM이 스스로 일을 만듭니다.
    if (isAutoModeRef.current && tasks.length === 0 && !approvalReq) {
      const autoTimer = setTimeout(() => {
        const creativeTasks = [
          '새로운 다크모드 대시보드 UI/UX 기획안 작성',
          '웹 앱 성능 최적화 방안 리서치 및 적용',
          '랜딩 페이지 트랜지션 애니메이션 스크립트 기획',
          '신규 사용자 온보딩 프로세스 시나리오 작성',
          '시스템 오류 자동 복구(Self-Healing) 로직 구조 설계',
          '가상 오피스 테마 추가 아이디어 발제'
        ];
        const randomTitle = creativeTasks[Math.floor(Math.random() * creativeTasks.length)];
        setTasks([{ id: Date.now(), title: `[자동 생성] ${randomTitle}`, specialty: 'text', status: 'todo', assignee: null }]);
        setToastMessage('💡 PM 에이전트가 자율적으로 새 작업을 발제했습니다!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }, 4000);
      return () => clearTimeout(autoTimer);
    }

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
              break; // 한 번에 하나의 작업만 할당하여 상태 중첩 방지
        }
      }
      if (taskAssigned) setTasks(newTasks);
    }, 1500);
    return () => clearTimeout(assignTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, npcs, isPaused, generatingId, approvalReq]);

  // 미디어 생성 시뮬레이션 핸들러
  async function handleGenerate(npc, linkedTask = null) {
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
      let actualModel = npc.model;
      const modelName = actualModel.toLowerCase();
      
      if (modelName.includes('claude')) globalKey = apiKeys.anthropic || apiKeys.llm;
      else if (modelName.includes('gemini')) globalKey = apiKeys.gemini || apiKeys.llm;
      else if (modelName.includes('grok')) globalKey = apiKeys.grok || apiKeys.llm;
      else if (modelName.includes('deepseek')) globalKey = apiKeys.deepseek || apiKeys.llm;
      else if (modelName.includes('gpt') || modelName.includes('o1')) globalKey = apiKeys.openai || apiKeys.llm;

      let apiKey = (npc.apiKey || globalKey || '').trim();

      // [버그 수정] 사용자가 특정 API 키만 입력하고 에이전트 모델을 변경하지 않았을 경우, 입력된 키의 모델로 자동 폴백
      if (!apiKey && !npc.apiKey) {
        if (apiKeys.gemini) { apiKey = apiKeys.gemini; actualModel = 'gemini-1.5-pro-latest'; }
        else if (apiKeys.anthropic) { apiKey = apiKeys.anthropic; actualModel = 'claude-3-5-sonnet-20240620'; }
        else if (apiKeys.openai) { apiKey = apiKeys.openai; actualModel = 'gpt-4o'; }
        else if (apiKeys.grok) { apiKey = apiKeys.grok; actualModel = 'grok-beta'; }
        else if (apiKeys.deepseek) { apiKey = apiKeys.deepseek; actualModel = 'deepseek-chat'; }
      }

      if (!apiKey) {
        setToastMessage(`[${actualModel}] 모델을 위한 API 키가 설정되지 않았습니다. 전역 API 설정 또는 에이전트 개별 API 키를 확인해주세요.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
                setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '에러 발생 ⚠️', x: n.prevX || n.x, y: n.prevY || n.y } : n));
                if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
        return;
      }
      if (!/^[\x00-\x7F]*$/.test(apiKey)) {
        setToastMessage(`[${actualModel}] API 키에 유효하지 않은 문자(한글 등)가 포함되어 있습니다. 영문/숫자로 된 올바른 API 키를 입력해주세요.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, x: n.prevX || n.x, y: n.prevY || n.y } : n));
                if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
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
        if (n.id === npc.id) return { ...n, isBusy: true, prevX: n.x, prevY: n.y, x: sourceId ? 65 : 50, y: 50 };
        if (sourceId && n.id === sourceId) return { ...n, isBusy: true, prevX: n.x, prevY: n.y, x: 35, y: 50 };
        return n;
      }));

      await new Promise(r => setTimeout(r, 300));
      addThinkingLog(npc.id, { type: 'user', content: `[User Prompt] ${userPrompt.substring(0, 150)}...` });
      await new Promise(r => setTimeout(r, 500));

      // Human-in-the-Loop: 작업 진행 전 승인 절차
      let isApproved = true;
      if (!isAutoModeRef.current) {
        setGeneratingMessage('사용자 결재 대기 중 ✋');
        addThinkingLog(npc.id, { type: 'system', content: '사용자 승인(Human-in-the-Loop) 대기 중...' });
        
        isApproved = await new Promise((resolve) => {
          setApprovalReq({ npc, prompt: userPrompt, resolve });
        });
        setApprovalReq(null);
      }

      if (!isApproved) {
        addThinkingLog(npc.id, { type: 'system', content: '작업이 반려되어 칸반 보드에서 제거됩니다.' });
        setToastMessage(`[${npc.name}]님의 작업이 반려되어 제거되었습니다.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '작업 반려됨 🛑', x: n.prevX || n.x, y: n.prevY || n.y } : n));
        if (linkedTask) setTasks(prev => prev.filter(t => t.id !== linkedTask.id));
        return;
      }

      addThinkingLog(npc.id, { type: 'system', content: '작업 승인됨. 모델 호출을 시작합니다.' });
      setGeneratingMessage(message); // 원래 메시지로 복구
      
      addThinkingLog(npc.id, { type: 'system', content: `AI 모델 [${npc.model}] 호출을 시작합니다... (스트리밍)` });
      addThinkingLog(npc.id, { type: 'ai', content: '' }); // AI 응답을 채워넣을 빈 로그 추가

      try {
        const baseUrl = (npc.baseUrl || '').trim();
        let generatedText = '';
        let attempt = 1;
        const maxAttempts = 2; // 본 시도 1회 + 복구 시도 1회
        let lastError = null;

        while (attempt <= maxAttempts) {
          try {
            let currentPrompt = userPrompt;
            if (attempt > 1) {
              addThinkingLog(npc.id, { type: 'system', content: `🚨 [Self-Healing] 에러 감지됨. 자가 복구 루프를 시작합니다. (재시도: ${attempt - 1}/${maxAttempts - 1})` });
              currentPrompt += `\n\n[시스템 오류] 이전 시도에서 다음과 같은 오류가 발생했습니다: ${lastError.message}\n오류 원인을 분석하고 우회하여 다시 시도해주세요.`;
              setGeneratingMessage(`자가 복구 중... 🛠️`);
            }
            generatedText = await callLLM(apiKey, actualModel, systemPrompt, currentPrompt, handleChunk, baseUrl);
            break; // 성공 시 루프 탈출
          } catch (err) {
            lastError = err;
            if (attempt === maxAttempts) throw err;
            addThinkingLog(npc.id, { type: 'system', content: `❌ 통신 오류 발생: ${err.message}` });
            attempt++;
            await new Promise(r => setTimeout(r, 2000));
            addThinkingLog(npc.id, { type: 'ai', content: '' }); // 재시도를 위해 빈 로그 초기화
          }
        }

        // 마크다운 백틱(```) 제거 방어 로직 (순수 코드만 남기기 위함)
        if (npc.specialty === 'code') {
          generatedText = generatedText.replace(/```[\w]*\n/g, '').replace(/```/g, '').trim();
        }

        output = { type: npc.specialty, content: generatedText };
        addThinkingLog(npc.id, { type: 'system', content: '모델 응답 스트림이 종료되었습니다. 결과물을 정리합니다.' });
      } catch (error) {
        console.error('LLM API Error:', error);
        setToastMessage(`텍스트/코드 생성 실패: ${error.message}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
                setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '에러 발생 ⚠️', x: n.prevX || n.x, y: n.prevY || n.y } : n));
                if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
        return;
      }
    } else if (npc.specialty === 'image') {
      // 개별 API 키 우선 적용, 없으면 전역 Image 키, 없으면 등록된 다른 전역 키 사용
      const apiKey = (npc.apiKey || apiKeys.image || apiKeys.openai || apiKeys.gemini || apiKeys.anthropic || apiKeys.llm || '').trim(); 
      if (!apiKey) {
        setToastMessage('Image 생성 API 키가 설정되지 않았습니다. 전역 API 키 또는 에이전트 개별 API 키를 설정해주세요.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
                setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '에러 발생 ⚠️', x: n.prevX || n.x, y: n.prevY || n.y } : n));
                if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
        return;
      }
      if (!/^[\x00-\x7F]*$/.test(apiKey)) {
        setToastMessage(`API 키에 유효하지 않은 문자(한글 등)가 포함되어 있습니다. 영문/숫자로 된 올바른 API 키를 입력해주세요.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, x: n.prevX || n.x, y: n.prevY || n.y } : n));
                if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
        return;
      }

      const textOutputEntry = Object.entries(mediaOutputs).find(([_, m]) => m.type === 'text');
      if (textOutputEntry) {
        sourceId = Number(textOutputEntry[0]);
        message = '기획안 컨셉에 맞춰 브랜드 이미지 생성 중... 🎨';
        completionStatus = '컨셉 맞춤 이미지 렌더링 완료! 🖼️';
      } else {
        message = '이미지 렌더링 중... 🎨';
      }
      if (linkedTask) {
        message = `칸반 이미지 작업 렌더링 중... 🚀`;
      }
      
      if (sourceId) setActiveConnection({ source: sourceId, target: npc.id });
      setGeneratingMessage(message);

      // 작업자 및 협업 대상자를 화이트보드로 이동 고정
      setNpcs(curr => curr.map(n => {
        if (n.id === npc.id) return { ...n, isBusy: true, prevX: n.x, prevY: n.y, x: sourceId ? 65 : 50, y: 50 };
        if (sourceId && n.id === sourceId) return { ...n, isBusy: true, prevX: n.x, prevY: n.y, x: 35, y: 50 };
        return n;
      }));

      // 박팀장의 기획안 결과물이 있다면 이를 포함하여 프롬프트 작성
      let userPrompt = linkedTask ? linkedTask.title : "IT 서비스에 어울리는 트렌디하고 세련된 브랜드 로고나 일러스트를 그려줘. 깔끔하고 직관적인 디자인으로.";
      if (textOutputEntry) {
        userPrompt += `\n\n다음 기획안 컨셉을 적극 반영해줘:\n${textOutputEntry[1].content}`;
      }

      // Human-in-the-Loop 컨펌
      let isApproved = true;
      if (!isAutoModeRef.current) {
        setGeneratingMessage('사용자 결재 대기 중 ✋');
        isApproved = await new Promise((resolve) => {
          setApprovalReq({ npc, prompt: userPrompt, resolve });
        });
        setApprovalReq(null);
      }

      if (!isApproved) {
        setToastMessage(`[${npc.name}]님의 작업이 반려되어 제거되었습니다.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '작업 반려됨 🛑', x: n.prevX || n.x, y: n.prevY || n.y } : n));
        if (linkedTask) setTasks(prev => prev.filter(t => t.id !== linkedTask.id));
        return;
      }
      setGeneratingMessage(message);

      try {
        const baseUrl = (npc.baseUrl || apiKeys.imageBaseUrl || '').trim();
        let imageUrl = '';
        let attempt = 1;
        const maxAttempts = 2;
        let lastError = null;
        
        while (attempt <= maxAttempts) {
          try {
            let currentPrompt = userPrompt;
            if (attempt > 1) {
              currentPrompt += ` (Note: Previous attempt failed due to error: ${lastError.message}. Please adjust parameters and try again.)`;
              setGeneratingMessage(`이미지 렌더링 자가 복구 중... 🛠️`);
            }
            imageUrl = await callImageGen(apiKey, currentPrompt, npc.model, baseUrl);
            break;
          } catch (err) {
            lastError = err;
            if (attempt === maxAttempts) throw err;
            attempt++;
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        output = { type: 'image', content: imageUrl };
      } catch (error) {
        console.error('DALL-E 3 Error:', error);
        setToastMessage(`이미지 생성 실패: ${error.message}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
                setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '에러 발생 ⚠️', x: n.prevX || n.x, y: n.prevY || n.y } : n));
                if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
        return;
      }
    } else if (npc.specialty === 'video') {
      const imageOutputEntry = Object.entries(mediaOutputs).find(([_, m]) => m.type === 'image');
      if (imageOutputEntry) { // 이미지 결과물이 있을 때
        sourceId = Number(imageOutputEntry[0]);
        const sourceNpc = npcs.find(n => n.id === sourceId);
        message = `${sourceNpc ? sourceNpc.name : '동료'}님의 이미지를 영상으로 변환 중 (I2V) 🎬`;
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
        if (n.id === npc.id) return { ...n, isBusy: true, prevX: n.x, prevY: n.y, x: sourceId ? 65 : 50, y: 50 };
        if (sourceId && n.id === sourceId) return { ...n, isBusy: true, prevX: n.x, prevY: n.y, x: 35, y: 50 };
        return n;
      }));
    }

    // API를 호출하지 않는 영상 작업만 기존처럼 2.5초 지연을 두어 시뮬레이션
    if (npc.specialty === 'video') {
      await new Promise(resolve => setTimeout(resolve, 2500));
      try {
        const apiKey = (npc.apiKey || apiKeys.video || apiKeys.openai || apiKeys.gemini || apiKeys.anthropic || apiKeys.llm || '').trim();
        const baseUrl = (npc.baseUrl || '').trim();
        if (!apiKey) {
          setToastMessage('Video API 키가 설정되지 않았습니다. 설정 모달에서 Video API 키를 입력해주세요.');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          setGeneratingId(null);
          setActiveConnection(null);
                    setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '에러 발생 ⚠️', x: n.prevX || n.x, y: n.prevY || n.y } : n));
                    if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
          return;
        }
        if (!/^[\x00-\x7F]*$/.test(apiKey)) {
          setToastMessage(`Video API 키에 유효하지 않은 문자(한글 등)가 포함되어 있습니다. 영문/숫자로 된 올바른 API 키를 입력해주세요.`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          setGeneratingId(null);
          setActiveConnection(null);
          setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, x: n.prevX || n.x, y: n.prevY || n.y } : n));
                    if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
          return;
        }

        let promptText = "High quality, cinematic, 4k resolution, smooth motion";
        let imageContext = null;

        const imageOutputEntry = Object.entries(mediaOutputs).find(([_, m]) => m.type === 'image');
        if (imageOutputEntry) {
          imageContext = imageOutputEntry[1].content;
          promptText = "Animate this image with cinematic camera pan, high quality";
        }
        
        if (linkedTask) promptText = linkedTask.title;

        // Human-in-the-Loop 컨펌
        let isApproved = true;
        if (!isAutoModeRef.current) {
          setGeneratingMessage('사용자 결재 대기 중 ✋');
          isApproved = await new Promise((resolve) => {
            setApprovalReq({ npc, prompt: promptText, resolve });
          });
          setApprovalReq(null);
        }

        if (!isApproved) {
          setToastMessage(`[${npc.name}]님의 작업이 반려되어 제거되었습니다.`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          setGeneratingId(null);
          setActiveConnection(null);
          setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '작업 반려됨 🛑', x: n.prevX || n.x, y: n.prevY || n.y } : n));
          if (linkedTask) setTasks(prev => prev.filter(t => t.id !== linkedTask.id));
          return;
        }
        setGeneratingMessage(message);

        let videoUrl = '';
        let attempt = 1;
        const maxAttempts = 2;
        let lastError = null;

        while (attempt <= maxAttempts) {
          try {
            if (attempt > 1) setGeneratingMessage(`영상 렌더링 자가 복구 중... 🛠️`);
            videoUrl = await callVideoGen(
              apiKey, 
              promptText, 
              npc.model, 
              baseUrl, 
              imageContext, 
              (progressMsg) => setGeneratingMessage(progressMsg)
            );
            break;
          } catch (err) {
            lastError = err;
            if (attempt === maxAttempts) throw err;
            attempt++;
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        output = { type: 'video', content: videoUrl };
      } catch (error) {
        console.error('Video API Error:', error);
        setToastMessage(`영상 생성 실패: ${error.message}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
                  setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '에러 발생 ⚠️', x: n.prevX || n.x, y: n.prevY || n.y } : n));
                  if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
        return;
      }
    } else if (npc.specialty === 'audio') {
      const apiKey = (npc.apiKey || apiKeys.audio || apiKeys.openai || apiKeys.llm || '').trim();
      const baseUrl = (npc.baseUrl || '').trim();
      if (!apiKey) {
        setToastMessage('Audio API 키가 설정되지 않았습니다. 전역 API 키를 확인해주세요.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
                  setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '에러 발생 ⚠️', x: n.prevX || n.x, y: n.prevY || n.y } : n));
                  if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
        return;
      }

      const textOutputEntry = Object.entries(mediaOutputs).find(([_, m]) => m.type === 'text');
      if (textOutputEntry) {
        sourceId = Number(textOutputEntry[0]);
        message = '작성된 문서를 음성으로 변환 중 (TTS)... 🎵';
        completionStatus = '텍스트 음성 변환 완료! 🎙️';
      } else {
        message = '오디오 합성 중... 🎵';
        completionStatus = '음성 파일 렌더링 완료! 🎙️';
      }
      
      if (linkedTask) message = `칸반 오디오 작업 렌더링 중... 🚀`;

      if (sourceId) setActiveConnection({ source: sourceId, target: npc.id });
      setGeneratingMessage(message);

      setNpcs(curr => curr.map(n => {
        if (n.id === npc.id) return { ...n, isBusy: true, prevX: n.x, prevY: n.y, x: sourceId ? 65 : 50, y: 50 };
        if (sourceId && n.id === sourceId) return { ...n, isBusy: true, prevX: n.x, prevY: n.y, x: 35, y: 50 };
        return n;
      }));

      let userPrompt = linkedTask ? linkedTask.title : "안녕하세요, 저는 당신의 텍스트를 목소리로 읽어주는 에이전트입니다.";
      if (textOutputEntry) {
        userPrompt = textOutputEntry[1].content.slice(0, 3000); // TTS 최대 길이 방어
      }

      let isApproved = true;
      if (!isAutoModeRef.current) {
        setGeneratingMessage('사용자 결재 대기 중 ✋');
        isApproved = await new Promise((resolve) => {
          setApprovalReq({ npc, prompt: userPrompt, resolve });
        });
        setApprovalReq(null);
      }

      if (!isApproved) {
        setToastMessage(`[${npc.name}]님의 작업이 반려되어 제거되었습니다.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
        setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '작업 반려됨 🛑', x: n.prevX || n.x, y: n.prevY || n.y } : n));
        if (linkedTask) setTasks(prev => prev.filter(t => t.id !== linkedTask.id));
        return;
      }
      setGeneratingMessage(message);

      try {
        let audioUrl = '';
        let attempt = 1;
        const maxAttempts = 2;
        let lastError = null;
        
        while (attempt <= maxAttempts) {
          try {
            if (attempt > 1) setGeneratingMessage(`오디오 합성 자가 복구 중... 🛠️`);
            audioUrl = await callAudioGen(apiKey, userPrompt, npc.model, baseUrl);
            break;
          } catch (err) {
            lastError = err;
            if (attempt === maxAttempts) throw err;
            attempt++;
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        output = { type: 'audio', content: audioUrl };
      } catch (error) {
        console.error('Audio API Error:', error);
        setToastMessage(`오디오 생성 실패: ${error.message}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setGeneratingId(null);
        setActiveConnection(null);
                  setNpcs(curr => curr.map(n => n.id === npc.id || n.id === sourceId ? { ...n, isBusy: false, status: '에러 발생 ⚠️', x: n.prevX || n.x, y: n.prevY || n.y } : n));
                  if (linkedTask) setTasks(prev => prev.map(t => t.id === linkedTask.id ? { ...t, status: 'error', assignee: null } : t));
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

    // 로컬 API 사용량 카운트 증가
    setApiUsage(prev => {
      const next = { ...prev, [npc.specialty]: (prev[npc.specialty] || 0) + 1 };
      localStorage.setItem('devsim_usage', JSON.stringify(next));
      return next;
    });

    // 10초 뒤에 결과물 말풍선 자동 닫기
    mediaOutputTimeouts.current[npc.id] = setTimeout(() => {
      setMediaOutputs(prev => { const next = { ...prev }; delete next[npc.id]; return next; });
    }, 10000);

    // 활동 로그 추가 유도 및 화이트보드 고정(isBusy) 해제
    setNpcs(curr => curr.map(n => {
      if (n.id === npc.id) return { ...n, status: completionStatus, isBusy: false, x: n.prevX || n.x, y: n.prevY || n.y };
      if (sourceId && n.id === sourceId) return { ...n, isBusy: false, x: n.prevX || n.x, y: n.prevY || n.y };
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
  function handleWebhookNotifications(npc, output) {
    sendToSlack(apiKeys.slackWebhookUrl, npc, output);
    sendToDiscord(apiKeys.discordWebhookUrl, npc, output);
  }

  // 미디어 다운로드 핸들러
  const handleDownloadMedia = async (e, url, type) => {
    e.stopPropagation(); // 부모 요소 클릭 이벤트(크게 보기) 방지
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `devsim_${type}_${new Date().getTime()}.${type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // CORS 등으로 fetch 실패 시 새 창으로 열기 (폴백)
      const link = document.createElement('a');
      link.href = url;
      link.download = `devsim_${type}_${new Date().getTime()}.${type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'png'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 코드 내보내기 헬퍼 함수들
  const exportToCodeSandbox = async (code, npcName) => {
    setToastMessage('CodeSandbox 환경을 구성 중입니다... ⏳');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    try {
      const res = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          files: {
            "package.json": { content: { dependencies: { react: "^18.0.0", "react-dom": "^18.0.0", "lucide-react": "latest" } } },
            "App.js": { content: code.includes('import React') ? code : `export default function App() {\n  return (\n    <div dangerouslySetInnerHTML={{__html: \`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`}} />\n  );\n}` },
            "index.js": { content: `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\n\nconst root = createRoot(document.getElementById("root"));\nroot.render(<App />);` },
            "index.html": { content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>` }
          }
        })
      });
      const data = await res.json();
      window.open(`https://codesandbox.io/s/${data.sandbox_id}`, '_blank');
    } catch(e) {
      alert('CodeSandbox 내보내기 실패: ' + e.message);
    }
  };

  const exportToCodePen = (code, npcName) => {
    const isHtml = code.toLowerCase().includes('<html') || !code.includes('import React');
    const form = document.createElement('form');
    form.action = 'https://codepen.io/pen/define';
    form.method = 'POST';
    form.target = '_blank';
    
    const input = document.createElement('input');
    input.name = 'data';
    input.type = 'hidden';
    input.value = JSON.stringify({
      title: `DevSim Code by ${npcName}`,
      html: isHtml ? code : `<div id="root"></div>`,
      js: isHtml ? '' : code,
      js_pre_processor: isHtml ? 'none' : 'babel',
      css_external: 'https://cdn.tailwindcss.com',
      js_external: isHtml ? '' : 'https://unpkg.com/react@18/umd/react.development.js;https://unpkg.com/react-dom@18/umd/react-dom.development.js'
    });
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const downloadCodeFile = (code, npcName) => {
    const isReact = code.includes('import React') || code.includes('export default');
    const extension = isReact ? 'jsx' : 'html';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DevSim_${npcName}_Code.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setToastMessage('코드가 다운로드되었습니다. VS Code나 GitHub에 활용하세요! 📥');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
        // 불필요한 일상 대화를 제거하고 전문적인 업무 조율 주제로 변경
        const topics = ['코드 아키텍처 개선', 'UI/UX 디자인 시스템', '성능 최적화 방안', '신규 API 연동', '프로젝트 마일스톤', '긴급 버그 원인 분석'];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        
        const emojis = ['💡', '✨', '🔥', '👀', '🤔', '💬'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const newX = targetNpc.x > 50 ? targetNpc.x - 7 : targetNpc.x + 7;

        setNpcs((currentNpcs) => 
          currentNpcs.map(npc => {
            if (npc.id === draggedId) {
              // 화면 밖으로 나가지 않도록 타겟의 위치에 따라 좌/우로 나란히 배치
              return { ...npc, prevX: npc.x, prevY: npc.y, x: newX, y: targetNpc.y, status: `🗣️ "${topic} 논의할까요?"`, isBusy: true };
            }
            if (npc.id === targetNpc.id) {
              return { ...npc, prevX: npc.x, prevY: npc.y, status: `💬 "좋아요! ${topic} 리뷰해봅시다."`, isBusy: true };
            }
            return npc;
          })
        );

        // 두 에이전트 중앙에 이모지 표시
        setInteractionEmoji({ x: (newX + targetNpc.x) / 2, y: targetNpc.y - 12, emoji: randomEmoji });

        // 회의 기록 텍스트 저장
        const logEntry = `[${new Date().toLocaleString()}] 🗣️ ${draggedNpc.name} & ${targetNpc.name} - 회의 주제: ${topic}`;
        setMeetingLogs(prev => [...prev, logEntry]);

        // 5초 후 대화 상태(isBusy) 해제 및 원래 위치로 복귀
        setTimeout(() => {
          setNpcs(current => current.map(n => 
            (n.id === draggedId || n.id === targetNpc.id) ? { ...n, isBusy: false, status: '회의 종료 👋', x: n.prevX || n.x, y: n.prevY || n.y } : n
          ));
          setInteractionEmoji(null);
        }, 5000);

        setToastMessage(`${draggedNpc.name}님과 ${targetNpc.name}님이 업무 회의를 시작했습니다! 💬`);
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
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes rotateAura {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
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
                  value={apiKeys.image || ''}
                  onChange={(e) => setApiKeys({...apiKeys, image: e.target.value})}
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="LLM 키와 동일하면 비워두세요"
                />
                <input 
                  type="text"
                  value={apiKeys.imageBaseUrl || ''}
                  onChange={(e) => setApiKeys({...apiKeys, imageBaseUrl: e.target.value})}
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl px-4 py-3 mt-2 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="Base URL (예: https://api.midjourney.com/v1) - 선택"
                />
                <p className="text-xs text-slate-500 ml-1">비공식 프록시 등 엔드포인트 우회가 필요할 경우 입력하세요.</p>
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
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Music className="w-4 h-4 text-amber-400" /> Audio/TTS API Key (선택)</label>
                <input 
                  type="password"
                  value={apiKeys.audio || ''}
                  onChange={(e) => setApiKeys({...apiKeys, audio: e.target.value})}
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="LLM (OpenAI) 키와 동일하면 비워두세요"
                />
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
            <div className="space-y-2 pt-3 border-t border-slate-700/50 mt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={apiKeys.autoSaveMedia || false} 
                  onChange={(e) => setApiKeys({...apiKeys, autoSaveMedia: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-sm font-semibold text-slate-300">결과물 자동 다운로드 (Auto-Save Media)</span>
              </label>
              <p className="text-xs text-slate-500 ml-7">이미지나 비디오가 생성 완료되면 브라우저 기본 다운로드 폴더에 즉시 저장합니다.</p>
            </div>

            {/* API 사용량 모니터링 */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 mt-6 shadow-inner">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> 로컬 API 호출 횟수 모니터링
              </label>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-600"><div className="text-[10px] text-slate-400 mb-1">기획</div><div className="text-base font-bold text-white">{apiUsage.text || 0}</div></div>
                <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-600"><div className="text-[10px] text-slate-400 mb-1">개발</div><div className="text-base font-bold text-white">{apiUsage.code || 0}</div></div>
                <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-600"><div className="text-[10px] text-slate-400 mb-1">이미지</div><div className="text-base font-bold text-white">{apiUsage.image || 0}</div></div>
                <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-600"><div className="text-[10px] text-slate-400 mb-1">영상</div><div className="text-base font-bold text-white">{apiUsage.video || 0}</div></div>
                <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-600"><div className="text-[10px] text-slate-400 mb-1">음성</div><div className="text-base font-bold text-white">{apiUsage.audio || 0}</div></div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-[10px] text-slate-500">※ 이 수치는 현재 브라우저에서 실행된 성공적인 호출 횟수입니다. 정확한 비용은 각 API 대시보드에서 확인하세요.</p>
                <button onClick={() => { if(window.confirm('사용량 기록을 초기화하시겠습니까?')) { setApiUsage({ text: 0, code: 0, image: 0, video: 0, audio: 0 }); localStorage.removeItem('devsim_usage'); } }} className="text-xs text-slate-400 hover:text-rose-400 transition-colors underline">기록 초기화</button>
              </div>
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

      {/* 코드 미리보기(Live Preview) 모달 */}
      {viewingCode && (
        <div 
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-8 cursor-default"
          onClick={() => setViewingCode(null)}
        >
          <div className="relative w-full h-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center shrink-0">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" /> Live Preview <span className="text-slate-400 text-xs font-normal">({viewingCode.npcName}의 코드)</span>
              </span>
              <button onClick={() => setViewingCode(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-700 hover:bg-slate-600 rounded-full p-1" title="닫기"><X className="w-4 h-4" /></button>
            </div>
            <iframe 
              srcDoc={getPreviewHtml(viewingCode.content)}
              className="w-full flex-1 bg-white"
              title="Code Preview"
              sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
            />
          </div>
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

      {/* 1:1 Chat Modal */}
      {chatNpcId && (() => {
        const chatNpc = npcs.find(n => n.id === chatNpcId);
        if (!chatNpc) return null;
        const currentHistory = chatHistory[chatNpcId] || [];

        return (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setChatNpcId(null)}>
            <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl h-[600px] max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${chatNpc.color} shadow-lg`}>
                    {React.createElement(chatNpc.icon || User, { className: "w-5 h-5 text-white" })}
                  </div>
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">{chatNpc.name} <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-normal">1:1 Chat</span></h3>
                    <p className="text-xs text-slate-400">{chatNpc.role} ({chatNpc.model})</p>
                  </div>
                </div>
                <button onClick={() => setChatNpcId(null)} className="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={chatScrollRef}>
                {currentHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p className="text-sm">에이전트와 대화를 시작해보세요!</p>
                  </div>
                )}
                {currentHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed shadow-md ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-700 text-slate-200 border border-slate-600 rounded-bl-none'
                    }`}>
                      {msg.content || (msg.role === 'assistant' && isChatTyping && idx === currentHistory.length - 1 ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : '')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                <form onSubmit={handleSendChat} className="relative flex items-center">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={`${chatNpc.name}에게 메시지 보내기...`}
                    disabled={isChatTyping}
                    className="w-full bg-slate-800 text-white border border-slate-600 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isChatTyping}
                    className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-full transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

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
                      task.status === 'in-progress' ? 'bg-indigo-500/20 text-indigo-400' :
                      task.status === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {task.status === 'in-progress' ? `WIP: ${task.assignee}` : task.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      {task.specialty === 'image' ? <Palette className="w-3 h-3"/> : task.specialty === 'code' ? <Code className="w-3 h-3"/> : task.specialty === 'video' ? <Video className="w-3 h-3"/> : task.specialty === 'audio' ? <Music className="w-3 h-3"/> : <FileText className="w-3 h-3"/>}
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
                
                const sourceColor = twColorToHex[sourceNpc.color] || '#6366f1';
                const targetColor = twColorToHex[targetNpc.color] || '#a855f7';

                return (
                  <g className="animate-pulse">
                    <defs>
                      <linearGradient id="laserGradient" x1={`${sourceNpc.x}%`} y1={`${sourceNpc.y}%`} x2={`${targetNpc.x}%`} y2={`${targetNpc.y}%`}>
                        <stop offset="0%" stopColor={sourceColor} />
                        <stop offset="100%" stopColor={targetColor} />
                      </linearGradient>
                    </defs>
                    {/* Source & Target Nodes (Data points) */}
                    <circle cx={`${sourceNpc.x}%`} cy={`${sourceNpc.y}%`} r="8" fill={sourceColor} className="animate-ping opacity-75" />
                    <circle cx={`${targetNpc.x}%`} cy={`${targetNpc.y}%`} r="8" fill={targetColor} className="animate-ping opacity-75" />
                    {/* Glowing Trail */}
                    <line
                      x1={`${sourceNpc.x}%`}
                      y1={`${sourceNpc.y}%`}
                      x2={`${targetNpc.x}%`}
                      y2={`${targetNpc.y}%`}
                      stroke="url(#laserGradient)"
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
                      stroke="url(#laserGradient)"
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
              transition: draggingId === npc.id ? 'none' : 'left 4.5s ease-in-out, top 4.5s ease-in-out' // 이동 속도를 늦춰 더 자연스럽게 만듦
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

                {/* 렌더링 중 화려한 오라(Aura) 효과 */}
                {generatingId === npc.id && (
                  <>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 animate-ping pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-dashed border-pink-500 border-r-purple-500 border-b-indigo-500 border-l-transparent opacity-70 pointer-events-none" style={{ animation: 'rotateAura 2s linear infinite' }}></div>
                  </>
                )}

                {/* 프로그레스 바 (작업 렌더링 중) */}
                {generatingId === npc.id && (
                  <div className="absolute bottom-16 px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] z-30 flex flex-col items-center gap-2 whitespace-nowrap border border-purple-500/50">
                    <span className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> 
                      {generatingMessage}
                    </span>
                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ animation: 'loadingBar 1.5s ease-in-out infinite' }}></div>
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
                           mediaOutputs[npc.id].type === 'audio' ? <Headphones className="w-3 h-3"/> : 
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
                            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/90 p-1 rounded backdrop-blur-sm border border-slate-600 shadow-md">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingCode({ content: mediaOutputs[npc.id].content, npcName: npc.name });
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded shadow-sm transition-colors"
                                title="미리보기 (Preview)"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportToCodeSandbox(mediaOutputs[npc.id].content, npc.name);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded shadow-sm transition-colors"
                                title="CodeSandbox로 열기"
                              >
                                <Box className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportToCodePen(mediaOutputs[npc.id].content, npc.name);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded shadow-sm transition-colors"
                                title="CodePen으로 열기"
                              >
                                <Monitor className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadCodeFile(mediaOutputs[npc.id].content, npc.name);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded shadow-sm transition-colors"
                                title="로컬 파일로 다운로드 (VS Code, GitHub용)"
                              >
                                <FileCode className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(mediaOutputs[npc.id].content);
                                  setToastMessage('코드가 클립보드에 복사되었습니다 📋');
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                }}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded shadow-sm transition-colors"
                                title="코드 복사"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
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
                        {mediaOutputs[npc.id].type === 'audio' && (
                          <div className="relative group p-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <audio src={mediaOutputs[npc.id].content} controls className="w-full h-8 rounded-md outline-none" />
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
              onClick={handleExportMeetings}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
              title="에이전트 회의 기록 다운로드 (.txt)"
            >
              <MessageCircle className="w-5 h-5" />
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
                <div className="flex gap-2">
                  <button 
                    onClick={() => setChatNpcId(selectedNPC.id)}
                    className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    1:1 대화
                  </button>
                  <button 
                    onClick={() => handleGenerate(selectedNPC)}
                    disabled={generatingId === selectedNPC.id}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors shadow-md"
                  >
                    {generatingId === selectedNPC.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    작업 지시
                  </button>
                </div>
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

                  {/* 주특기 (Specialty) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5"/> 주특기 (Specialty)</label>
                    <select
                      value={editingAgent.specialty}
                      onChange={(e) => setEditingAgent({...editingAgent, specialty: e.target.value, model: modelOptions[e.target.value][0].value})}
                      className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                      <option value="text">기획 / 문서 (Text)</option>
                      <option value="code">개발 / 코드 (Code)</option>
                      <option value="image">디자인 / 이미지 (Image)</option>
                      <option value="video">영상 제작 (Video)</option>
                      <option value="audio">음성 / 오디오 (Audio)</option>
                    </select>
                  </div>

                  {/* API 모델 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5"/> 연결할 API / 모델</label>
                    <select
                      value={editingAgent.model}
                      onChange={(e) => setEditingAgent({...editingAgent, model: e.target.value})}
                      className="w-full bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                      {(modelOptions[editingAgent.specialty] || modelOptions.text).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
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

                  {/* 개별 Base URL (선택사항) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> 개별 Base URL (선택사항)</label>
                    <input 
                      type="text"
                      value={editingAgent.baseUrl || ''} 
                      onChange={(e) => setEditingAgent({...editingAgent, baseUrl: e.target.value})}
                      className="w-full bg-slate-900 text-white text-sm border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="비공식 API 우회 시 입력 (선택)"
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