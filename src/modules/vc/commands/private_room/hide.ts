import { embedTemplate } from "@lib/embedTemplate";
import { fetchRoom } from "@modules/vc/lib/fetch_room";
import { SubCommand } from "@structs/command/subcommand";

export default SubCommand(

  // Info
  {
    name: "hide",
    description: "hide/show room",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const { room } = await fetchRoom(msg).catch((x) =>
      x == "noRoom" ? { room: null, dbRoom: null } : Promise.reject(x),
    );
    if (!room) return { content: "You don't have a private room" };

    let currentState = room
      .permissionsFor(msg.guildId as string)
      ?.has("ViewChannel");

    currentState = currentState == undefined ? true : currentState;

    await room.permissionOverwrites.edit(msg.guildId as string, {
      ViewChannel: !currentState,
      Connect: false,
      Stream: true,
      Speak: true,
    });

    const responseEmbed = embedTemplate().setDescription(
      `Room is now ${currentState ? "hidden" : "visible"}`,
    );

    return { embeds: [responseEmbed] };
  }

);
