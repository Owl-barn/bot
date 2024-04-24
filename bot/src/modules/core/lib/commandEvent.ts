import { state } from "@app";
import { warningEmbedTemplate } from "@lib/embedTemplate";
import { getAccessInfo } from "@structs/access/getAcessInfo";
import { subscriptionTiers } from "@structs/access/subscription";
import { CommandGroup } from "@structs/command";
import { CommandStruct } from "@structs/command/command";
import { ParentCommandStruct } from "@structs/command/parent";
import { ReturnMessage } from "@structs/returnmessage";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import { localState } from "..";
import { respond } from "./respond";
import { getCommand } from "./getCommand";
import { errorEmbed } from "./interactionError";

export async function commandEvent(msg: ChatInputCommandInteraction) {
  const timeStart = Date.now();

  let command: ReturnType<typeof getCommand>;
  try {
    command = getCommand(msg);
  } catch (error) {
    localState.log.error(`Error getting command: ${error}`);

    return await msg.reply({ embeds: [errorEmbed()] });
  }

  const commandName = command.info.commandName as string;

  let parentCommand: ParentCommandStruct | undefined;
  // if the command includes a dash, that means its a subcommand
  if (commandName.includes("-")) {
    parentCommand = state.commands.get(
      commandName.split("-")[0],
    ) as ParentCommandStruct;
  }

  const group = (command as CommandStruct).info.group || parentCommand?.info.group;
  if (!group) return;

  // Check if owner command.
  if (group === CommandGroup.owner && msg.user.id !== state.env.OWNER_ID)
    return await quickReply(
      msg,
      "You are not allowed to do this command.",
    );

  // Check if premium command.
  const accessInfo = await getAccessInfo(command.info.access, msg.user.id, msg.guildId || undefined);
  if (accessInfo.guildAccess === false && accessInfo.userAccess === false) {

    const embed = warningEmbedTemplate();
    embed.setTitle("🦉 Subscription Required");
    embed.setDescription(`It seems like you found a premium command! premium commands are only available to subscribers. You can subscribe to ${state.env.APP_NAME} premium by clicking the button below.`);

    const fields = [];
    if (accessInfo.recommendedGuildSubscriptions.length > 0) {
      fields.push({
        name: "Available with the following guild subscriptions",
        value: accessInfo.recommendedGuildSubscriptions
          .map(x => `\`${subscriptionTiers[x.key].name}\``)
          .join(", "),
      });
    }

    if (accessInfo.recommendedUserSubscriptions.length > 0) {
      fields.push({
        name: "Available with the following personal subscriptions",
        value: accessInfo.recommendedUserSubscriptions
          .map(x => `\`${subscriptionTiers[x.key].name}\``)
          .join(", "),
      });
    }

    if (fields.length > 0) embed.addFields(fields);
    else embed.setDescription("This command is not available to you.");

    const donateButton = new ButtonBuilder()
      .setLabel("Subscribe")
      .setStyle(ButtonStyle.Link)
      .setURL(state.env.DONATION_URL);

    const discordButton = new ButtonBuilder()
      .setLabel("Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL(state.env.SUPPORT_SERVER);

    const component = new ActionRowBuilder().setComponents([
      donateButton,
      discordButton,
    ]) as ActionRowBuilder<ButtonBuilder>;

    return await msg
      .reply({
        ephemeral: true,
        embeds: [embed],
        components: [component],
      })
      .catch(console.error);
  }

  // Check if the user is throttled.
  const isThrottled = state.throttle.isThrottled(
    msg.guildId || "e",
    msg.user.id,
    command.info,
  );

  if (isThrottled)
    return await quickReply(msg, `Throttled, try again in \`${isThrottled}\` seconds`);

  // Check if the bot has the needed permissions.
  if (command.info.botPermissions) {
    const missingPerms = command.info.botPermissions.filter((x) => !msg.guild?.members.me?.permissions.has(x));

    if (missingPerms.length > 0)
      return await quickReply(
        msg,
        `Missing permissions: \`${missingPerms.join("`, `")}\``,
      );
  }

  await respond(msg, timeStart, command?.run as (interaction: ChatInputCommandInteraction) => Promise<ReturnMessage>);
}

const quickReply = async (msg: ChatInputCommandInteraction, content: string): Promise<void> => {
  await msg
    .reply({ ephemeral: true, content })
    .catch(error => {
      localState.log.error(`Error sending quick reply: `, { error });
    });
};
