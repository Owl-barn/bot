import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { moderation_type } from "@prisma/client";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { formatInfraction } from "../../lib/formatinfraction";

export default SubCommand(

  // Info
  {
    name: "search",
    description: "Search for specific moderation logs.",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "query",
        description: "Search all logs with a query",
        required: false,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "event_type",
        description: "What type of moderation log to search for",
        required: false,
        choices: [
          { name: "ban", value: "ban" },
          { name: "kick", value: "kick" },
          { name: "warn", value: "ban" },
          { name: "timeout", value: "timeout" },
        ],
      },
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "User to view logs for",
        required: false,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const user = msg.options.getUser("user");
    const query = msg.options.getString("query");
    const type = msg.options.getString("event_type");

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    if (!query && !type && !user) {
      const response = failEmbed.setDescription(
        "You need to fill in atleast 1 of the fields",
      );
      return { embeds: [response] };
    }

    const logs = await state.db.moderation_log.findMany({
      where: {
        guild_id: msg.guildId as string,
        AND: [
          { reason: { contains: query ?? undefined } },
          {
            moderation_type: type
              ? (type as moderation_type)
              : undefined,
          },
          {
            OR: [
              { user: user ? user.id : undefined },
              { moderator: user ? user.id : undefined },
            ],
          },
        ],
      },
      orderBy: {
        created: "asc",
      },
      take: 20,
    });

    const logList = logs.map((infraction, index) => ({
      name: `#${index + 1}`,
      value: formatInfraction(infraction, true),
      inline: true,
    }));

    logList.length !== 0
      ? embed.addFields(logList)
      : embed.addFields([
        {
          name: "No logs found",
          value: "Please try another search query",
        },
      ]);

    let description = "";
    if (user) description += `**User**: \`${user.tag}\`\n`;
    if (query) description += `**Query**: \`${query}\`\n`;
    if (type) description += `**Type**: \`${type}\`\n`;

    embed.setTitle("Search results:");
    embed.setDescription(description);

    return { embeds: [embed] };
  }
);
