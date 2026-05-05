export async function callLLM(apiKey, model, systemPrompt, userPrompt, onChunk, baseUrl = '') {
  // TODO: 실제 OpenAI/Anthropic 등의 API 호출 로직 구현
  const endpoint = baseUrl || 'https://api.openai.com/v1/chat/completions';
  // 현재는 빌드 성공을 위한 임시 텍스트 반환
  const response = `[${model}] 성공적으로 작업을 완료했습니다!`;
  if (onChunk) {
    onChunk(response);
  }
  return response;
}

export async function callImageGen(apiKey, prompt, model = 'dall-e-3', baseUrl = '') {
  // TODO: 실제 DALL-E 3 등 이미지 생성 API 연동
  const endpoint = baseUrl || 'https://api.openai.com/v1/images/generations';
  // 현재는 빌드 성공을 위한 더미 이미지 URL 반환
  return 'https://via.placeholder.com/512?text=Generated+Image';
}