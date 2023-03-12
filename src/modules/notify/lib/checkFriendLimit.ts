import { failEmbedTemplate } from "@lib/embedTemplate";
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
  if (userFriendCount >= 20) {
    return {
      embeds: [failEmbedTemplate("You can't have more than 10 friends!")],
    };
  }

  // fetch friend's friends.
  const friendFriendCount = await state.db.friendship.count({
    where: { friendId },
  });

  // Check if friend has too many friends.
  if (friendFriendCount >= 12) {
    return {
      embeds: [failEmbedTemplate("That user has too many friends!")],
    };
  }

  return null;
}
