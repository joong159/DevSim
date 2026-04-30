export const callLLM = async (rawApiKey, model, systemPrompt, userPrompt, onChunk) => {
  const apiKey = (rawApiKey || '').trim(); // API 키 앞뒤의 공백과 줄바꿈을 자동으로 제거
  const targetModel = model || 'gpt-4o';

  // 1. Google Gemini API
  if (apiKey.startsWith('AIza') || targetModel.includes('gemini')) {
    const geminiModel = targetModel.includes('gemini') ? targetModel : 'gemini-1.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }]
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gemini API 요청 실패');
    }
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text;
  }

  // 2. Anthropic Claude API
  if (targetModel.includes('claude')) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // Claude는 'x-api-key' 헤더를 사용합니다
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true' // CORS 프론트엔드 직접 호출 허용
      },
      body: JSON.stringify({
        model: targetModel,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Claude API 요청 실패');
    }
    const data = await response.json();
    return data.content[0].text;
  }

  // 3. xAI Grok API (Grok 4)
  if (targetModel.includes('grok')) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Grok API 요청 실패');
    }
    const data = await response.json();
    return data.choices[0]?.message?.content;
  }

  // 4. DeepSeek API (DeepSeek V4)
  if (targetModel.includes('deepseek')) {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'DeepSeek API 요청 실패');
    }
    const data = await response.json();
    return data.choices[0]?.message?.content;
  }

  // 5. OpenAI API (기본값 - GPT-5.4 등)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: targetModel,
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
  return data.choices[0]?.message?.content;
};

export const callImageGen = async (rawApiKey, prompt) => {
  const apiKey = (rawApiKey || '').trim();
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'API 요청 실패');
  }
  
  const data = await response.json();
  return data.data[0].url;
};