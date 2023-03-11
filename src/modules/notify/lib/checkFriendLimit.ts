import { failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";

export async function checkFriendLimit(
  friend_id: string,
  user_id: string,
) {
  // Fetch user's friends.
  const userFriendCount = await state.db.friendships.count({
    where: { user_id },
  });

  // Check if user has too many friends.
  if (userFriendCount >= 20) {
    return {
      embeds: [failEmbedTemplate("You can't have more than 10 friends!")],
    };
  }

  // fetch friend's friends.
  const friendFriendCount = await state.db.friendships.count({
    where: { friend_id },
  });

  // Check if friend has too many friends.
  if (friendFriendCount >= 12) {
    return {
      embeds: [failEmbedTemplate("That user has too many friends!")],
    };
  }

  return null;
}
