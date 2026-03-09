export function isGroupChat(chatId: number): boolean {
  return chatId < 0;
}

export function extractMentionText(text: string, botUsername: string): string | null {
  const mention = `@${botUsername}`;
  if (!text.includes(mention)) return null;
  return text.replace(mention, '').trim() || null;
}
