export async function callLLM(apiKey, model, systemPrompt, userPrompt, onChunk, baseUrl = '') {
  // 딥시크 모델 통합 대응 (예전 coder 모델명 호출 시 chat 모델로 자동 변환)
  if (model === 'deepseek-coder') model = 'deepseek-chat';

  const isAnthropic = model.toLowerCase().includes('claude');
  const isGemini = model.toLowerCase().includes('gemini');
  const isGrok = model.toLowerCase().includes('grok');
  const isDeepseek = model.toLowerCase().includes('deepseek');

  let endpoint = baseUrl;
  if (endpoint) {
    // 사용자가 Base URL 도메인만 입력하고 세부 엔드포인트를 생략한 경우 자동 추가
    if (!endpoint.includes('/chat/completions') && !endpoint.includes('/messages') && !endpoint.includes(':streamGenerateContent')) {
      if (isAnthropic) endpoint = endpoint.replace(/\/$/, '') + '/v1/messages';
      else if (isGemini) endpoint = endpoint.replace(/\/$/, '') + `/v1beta/models/${model}:streamGenerateContent?alt=sse`;
      else endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }
  } else {
    if (isAnthropic) endpoint = 'https://api.anthropic.com/v1/messages';
    else if (isGemini) endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
    else if (isGrok) endpoint = 'https://api.x.ai/v1/chat/completions';
    else if (isDeepseek) endpoint = 'https://api.deepseek.com/chat/completions';
    else endpoint = 'https://api.openai.com/v1/chat/completions';
  }
  
  const headers = { 'Content-Type': 'application/json' };
  let body = {};

  // 모델에 따른 헤더 및 바디(Payload) 구성 분기
  if (isAnthropic) {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true'; // 브라우저 환경에서 직접 호출 허용
    body = {
      model: model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 4096,
      stream: true,
    };
  } else if (isGemini) {
    headers['x-goog-api-key'] = apiKey;
    body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
    };
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
    body = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `LLM API 요청 실패: ${response.status}`;
    try {
      const err = JSON.parse(errText);
      errMsg = err.error?.message || err.message || errMsg;
    } catch (e) {
      errMsg += ` - ${errText.substring(0, 100)}`;
    }
    throw new Error(errMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 남김

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
        try {
          const data = JSON.parse(trimmedLine.slice(6));
          let delta = '';

          // 스트리밍 응답 데이터 파싱 분기
          if (isAnthropic) {
            if (data.type === 'content_block_delta' && data.delta?.text) {
              delta = data.delta.text;
            }
          } else if (isGemini) {
            delta = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else {
            delta = data.choices?.[0]?.delta?.content || '';
          }

          if (delta) {
            fullText += delta;
            if (onChunk) onChunk(delta); // UI에 타이핑 효과 전달
          }
        } catch (e) {
          // JSON 파싱 에러(청크 분할 등) 무시
        }
      }
    }
  }

  return fullText;
}

export async function callImageGen(apiKey, prompt, model = 'dall-e-3', baseUrl = '') {
  const isStability = model.toLowerCase().includes('stable-diffusion') || model.toLowerCase().includes('sd3');

  if (isStability) {
    const endpoint = baseUrl || 'https://api.stability.ai/v2beta/stable-image/generate/sd3';
    
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'jpeg');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'image/*'
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `이미지 생성 실패: ${response.status}`;
      try {
        const err = JSON.parse(errText);
        errMsg = err.message || err.error?.message || errMsg;
      } catch (e) {
        errMsg += ` - ${errText.substring(0, 100)}`;
      }
      throw new Error(errMsg);
    }

    // Stability AI는 'Accept: image/*' 요청 시 바이너리(Blob)를 직접 반환합니다.
    const blob = await response.blob();
    return URL.createObjectURL(blob); // 브라우저 메모리에 이미지를 올리고 URL 생성
  }

  const endpoint = baseUrl || 'https://api.openai.com/v1/images/generations';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      n: 1,
      size: '1024x1024'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `이미지 생성 실패: ${response.status}`;
    try {
      const err = JSON.parse(errText);
      errMsg = err.error?.message || err.message || errMsg;
    } catch (e) {
      errMsg += ` - ${errText.substring(0, 100)}`;
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.data[0].url; // 생성된 이미지의 URL 반환
}

export async function callVideoGen(apiKey, prompt, model = 'luma-dream-machine', baseUrl = '', imageContext = null, onProgress = null) {
  const isRunway = model.toLowerCase().includes('runway');

  if (isRunway) {
    // Runway ML API 연동 (Gen-3 Alpha)
    const endpoint = baseUrl || 'https://api.dev.runwayml.com/v1/image_to_video';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Runway-Version': '2024-11-06'
    };

    const body = {
      model: 'gen3a_turbo', // 기본적으로 Gen-3 Alpha Turbo 모델 사용
      promptText: prompt,
    };
    
    if (imageContext) body.promptImage = imageContext;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Runway 영상 생성 요청 실패: ${response.status}`;
      try {
        const err = JSON.parse(errText);
        errMsg = err.error?.message || err.message || errMsg;
      } catch (e) {
        errMsg += ` - ${errText.substring(0, 100)}`;
      }
      throw new Error(errMsg);
    }
    
    const data = await response.json();
    const taskId = data.id;
    
    // 상태 확인(Polling) 루프
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const pollRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, { headers });
      const pollData = await pollRes.json();
      
      if (pollData.status === 'SUCCEEDED') return pollData.output[0]; // 생성된 영상 URL 반환
      else if (pollData.status === 'FAILED') throw new Error(`Runway 비디오 생성 실패: ${pollData.failure || '알 수 없는 오류'}`);
      
      if (onProgress) onProgress(`영상 렌더링 중... (Runway: ${pollData.status || 'PENDING'}) 🎬`);
    }
  }

  // 기본값: Luma AI (Dream Machine) REST API 연동
  const endpoint = baseUrl || 'https://api.lumalabs.ai/dream-machine/v1/generations';
  const requestBody = { prompt };
  if (imageContext) requestBody.keyframes = { frame0: { type: 'image', url: imageContext } };

  const createRes = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify(requestBody) });
  if (!createRes.ok) {
    const errText = await createRes.text();
    let errMsg = `Luma API 요청 실패: ${createRes.status}`;
    try {
      const err = JSON.parse(errText);
      errMsg = err.message || err.error?.message || errMsg;
    } catch (e) {
      errMsg += ` - ${errText.substring(0, 100)}`;
    }
    throw new Error(errMsg);
  }

  const createData = await createRes.json();

  // 상태 확인(Polling) 루프
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 5000)); 
    const pollRes = await fetch(`${endpoint}/${createData.id}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
    if (!pollRes.ok) throw new Error('Luma API 상태 확인 실패');
    const pollData = await pollRes.json();
    
    if (pollData.state === 'completed') return pollData.assets.video;
    else if (pollData.state === 'failed') throw new Error('비디오 생성 실패 (Luma API 내부 오류)');
    
    if (onProgress) onProgress(`영상 렌더링 중... (Luma: ${pollData.state}) 🎬`);
  }
}

export async function callAudioGen(apiKey, prompt, model = 'tts-1', baseUrl = '') {
  // OpenAI 호환 TTS (Text-To-Speech) API 연동
  const endpoint = baseUrl || 'https://api.openai.com/v1/audio/speech';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      input: prompt,
      voice: 'alloy' // 기본 음성 (alloy, echo, fable, onyx, nova, shimmer 선택 가능)
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `오디오 생성 실패: ${response.status}`;
    try {
      const err = JSON.parse(errText);
      errMsg = err.error?.message || err.message || errMsg;
    } catch (e) {
      errMsg += ` - ${errText.substring(0, 100)}`;
    }
    throw new Error(errMsg);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob); // 생성된 음성 파일(mp3)의 브라우저 URL 반환
}