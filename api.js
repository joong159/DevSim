export const callLLM = async (apiKey, model, systemPrompt, userPrompt) => {
  // 1. Google Gemini API (if key starts with 'AIza')
  if (apiKey.startsWith('AIza')) {
    const geminiModel = model && model.includes('gemini') ? model : 'gemini-1.5-flash';
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

  // 2. OpenAI API (default)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
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
  // 응답 배열 방어코드 적용
  return data.choices[0]?.message?.content || data.choices?.message?.content;
};

export const callImageGen = async (apiKey, prompt) => {
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