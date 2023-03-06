import {
  Guild,
  ChannelType,
  Collection,
  TextChannel,
  ApplicationCommandOptionType,
  AttachmentBuilder,
} from "discord.js";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
      name: "info",
      description: "Get info about a guild",

      arguments: [
        {
          type: ApplicationCommandOptionType.String,
          name: "guild_id",
          description: "guild id",
          required: true,
        },
      ],

      throttling: {
        duration: 60,
        usages: 3,
      },
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    const guildID = msg.options.getString("guild_id");
    const client = msg.client;

    let guild = msg.guild as Guild;

    if (guildID) {
      guild = client.guilds.cache.get(guildID) || guild;
    }

    const query = await client.db.guilds.findUnique({
      where: { guild_id: guild.id },
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

    const output = [
      guild.name,
      ownerString,
      "\n",
      `premium: ${query?.premium}`,
      `level: ${query?.level}`,
      `Banned: ${query?.banned}`,
      `Dev: ${query?.dev}`,
      "\n",
      `Joined: ${query?.created}`,
      `Staff: ${query?.staff_role}`,
      "\n",
      `channels:\n${channelOutput}`,
      "\n",
      `roles:\n${roleOutput}`,
    ];

    const attachment = new AttachmentBuilder(
      Buffer.from(output.join("\n")),
    );
    attachment.setName("info.txt");

    return { files: [attachment] };
  }
};
