export const sendToSlack = async (webhookUrl, npc, output) => {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[${npc.name} - ${npc.role}] 작업 완료!\n\n${output.content}`
      })
    });
  } catch (error) {
    console.error('Slack Webhook Error:', error);
  }
};

export const sendToDiscord = async (webhookUrl, npc, output) => {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**[${npc.name} - ${npc.role}]** 작업 완료! 🎉\n\n${output.content}`
      })
    });
  } catch (error) {
    console.error('Discord Webhook Error:', error);
  }
};