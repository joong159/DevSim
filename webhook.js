export const sendToSlack = async (webhookUrl, npc, output) => {
  if (!webhookUrl) return;

  const blocks = [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": `🤖 [${npc.name}]님의 작업 완료!`, "emoji": true }
    },
    {
      "type": "context",
      "elements": [{ "type": "mrkdwn", "text": `*역할:* ${npc.role} | *특기:* ${output.type}` }]
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

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
  } catch (error) {
    console.error('Error sending to Slack webhook:', error);
  }
};

export const sendToDiscord = async (webhookUrl, npc, output) => {
  if (!webhookUrl) return;

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

  const embed = {
    author: { name: `[${npc.name}]님의 작업 완료!` },
    description: `**역할:** ${npc.role}\n**특기:** ${output.type}`,
    color: colorMap[npc.color] || 5855577,
    timestamp: new Date().toISOString(),
    footer: { text: "DevSim" }
  };

  if (output.type === 'text') embed.fields = [{ name: '결과물', value: output.content.substring(0, 1024) }];
  else if (output.type === 'code') embed.description += "\n\n**결과물:**\n```" + (output.content.substring(0, 1500)) + "\n```";
  else if (output.type === 'image') {
    embed.fields = [{ name: '결과물', value: '아래 이미지 확인' }];
    embed.image = { url: output.content };
  } else if (output.type === 'video') embed.fields = [{ name: '결과물', value: `영상 재생하기` }];

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "DevSim 알림봇",
        avatar_url: "https://i.imgur.com/4M34hi2.png", // Generic Bot Icon
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error('Error sending to Discord webhook:', error);
  }
};