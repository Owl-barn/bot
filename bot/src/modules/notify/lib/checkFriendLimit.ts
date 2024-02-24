import { state } from "@app";

export async function checkFriendLimit(
  friendId: string,
  userId: string,
) {
  // Fetch user's friends.
  const userFriendCount = await state.db.friendship.count({
    where: { userId },
  });

  // Check if user has too many friends.
  if (userFriendCount >= state.env.VOICE_NOTIFY_ALERT_LIMIT) {
    return { error: `You can't have more than ${state.env.VOICE_NOTIFY_ALERT_LIMIT} friends!` };
  }

  // fetch friend's friends.
  const friendFriendCount = await state.db.friendship.count({
    where: { friendId },
  });

  // Check if friend has too many friends.
  if (friendFriendCount >= state.env.VOICE_NOTIFY_FRIEND_LIMIT) {
    return { error: `That user has too many friends! (${state.env.VOICE_NOTIFY_FRIEND_LIMIT})` };
  }

  return { friendCount: userFriendCount };
}
