import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import {
  Guild,
  ChannelType,
  Collection,
  TextChannel,
  ApplicationCommandOptionType,
  AttachmentBuilder,
} from "discord.js";

export default SubCommand(

  // Info
  {
    name: "info",
    description: "Get info about a guild",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "guild_id",
        description: "guild id",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "show_users",
        description: "show users in the guild",
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
    const guildID = msg.options.getString("guild_id");
    const showUsers = msg.options.getBoolean("show_users") || false;
    const client = msg.client;

    let guild = msg.guild as Guild;

    if (guildID) {
      guild = client.guilds.cache.get(guildID) || guild;
    }

    const query = await state.db.guild.findUnique({
      where: { id: guild.id },
    });

    const owner = await client.users.fetch(guild.ownerId);
    const ownerString = `Server owner:\n name: ${owner.tag}\n ID: ${owner.id}`;

    let channels = guild.channels.cache.filter((x) =>
      [ChannelType.GuildText, ChannelType.GuildVoice].includes(x.type),
    ) as Collection<string, TextChannel>;

    channels = channels.sort((x, y) => y.rawPosition - x.rawPosition);

    const channelOutput = channels
      .map(
        (x) =>
          `id: ${x.id} view: ${x.viewable} type: ${x.type} name: ${x.name}`,
      )
      .join("\n");

    const roles = guild.roles.cache.sort((x, y) => y.position - x.position);
    const roleOutput = roles
      .map((x) => `id: ${x.id} name: ${x.name}`)
      .join("\n");

    let userOutput;
    if (showUsers) {
      const users = guild.members.cache;

      userOutput = users
        .map(
          (x) =>
            `id: ${x.id} name: ${x.user.username} role: ${x.roles.highest.name}`,
        )
        .join("\n");
    }

    const output = [
      guild.name,
      ownerString,
      "\n",
      `premium: ${query?.subscriptionTier}`,
      `level: ${query?.level}`,
      `Banned: ${query?.isBanned}`,
      `Dev: ${query?.isDev}`,
      "\n",
      `Joined: ${query?.createdAt}`,
      `Staff: ${query?.staffRoleId}`,
      "\n",
      `channels:\n${channelOutput}`,
      "\n",
      `roles:\n${roleOutput}`,
      "\n",
      userOutput ? `users:\n${userOutput}` : "",
    ];

    const attachment = new AttachmentBuilder(
      Buffer.from(output.join("\n")),
    );
    attachment.setName("info.txt");

    return { files: [attachment] };
  }
);
