export function publicUser(user: any) {
  return {
    id: user._id.toString(),
    name: user.name || '',
    phoneNumber: user.phoneNumber || '',
    email: user.email || '',
    leetcodeUsername: user.leetcodeUsername,
    telegramChatId: user.telegramChatId || '',
    alertTime: user.alertTime,
    alertFrequency: user.alertFrequency || '1',
    alertMethod: 'telegram',
    isActive: user.isActive,
    currentStreak: user.currentStreak,
  };
}
