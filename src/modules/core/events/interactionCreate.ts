import { failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { CommandStruct } from "@structs/command/command";
import { ParentCommandStruct } from "@structs/command/parent";
import { SubCommandStruct } from "@structs/command/subcommand";
import { Event } from "@structs/event";
import { ReturnMessage } from "@structs/returnmessage";
import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";

const errorEmbed = failEmbedTemplate(
  `An error occurred, please make a report of this in [the Raven bot discord server](${state.env.SUPPORT_SERVER})`,
);

export default Event({
  name: "interactionCreate",
  once: false,

  async execute(interaction) {
    const guildconfig = interaction.guild && state.guilds.get(interaction.guild.id);
    if (guildconfig?.isBanned) return;

    if (interaction.isButton()) {
      return await buttonEvent(interaction)
        .catch(console.error);
    }
    if (interaction.isChatInputCommand()) {
      return await commandEvent(interaction)
        .catch(console.error);
    }
  },
});

const quickReply = async (msg: ChatInputCommandInteraction, content: string): Promise<void> => {
  await msg
    .reply({ ephemeral: true, content })
    .catch(console.error);
};

const commandEvent = async (msg: ChatInputCommandInteraction): Promise<void> => {
  let { commandName } = msg;
  if (!msg.guildId) return;

  const timeStart = Date.now();

  const subCommandGroup = msg.options.getSubcommandGroup(false);
  const subCommand = msg.options.getSubcommand(false);

  subCommandGroup ? (commandName += `-${subCommandGroup}`) : null;
  subCommand ? (commandName += `-${subCommand}`) : null;

  const command = state.commands.get(commandName) as
    | SubCommandStruct
    | CommandStruct;

  if (!command) return;

  let parentCommand: ParentCommandStruct | undefined;
  if (commandName.includes("-")) {
    // if the command includes a dash, that means its a subcommand
    parentCommand = state.commands.get(
      commandName.split("-")[0],
    ) as ParentCommandStruct;
  }

  const group = (command as CommandStruct).info.group || parentCommand?.info.group;
  if (!group) return;

  if (
    group === CommandGroup.moderation &&
    msg.user.id == "213911889325981697"
  ) {
    return;
  }

  if (group === CommandGroup.owner && msg.user.id !== state.env.OWNER_ID)
    // Chek if owner command.
    return await quickReply(
      msg,
      "You are not allowed to do this command.",
    );

  const isPremium = state.guilds.get(msg.guildId)?.subscriptionTier ?? 0 > 0;

  // Check if premium command.
  if (command.info.premium && !isPremium && !(msg.user.id === state.env.OWNER_ID))
    return await quickReply(msg, "This command is premium only.");

  // Check if the user is throttled.
  const isThrottled = state.throttle.isThrottled(
    msg.guildId || "e",
    msg.user.id,
    command.info,
  );

  if (isThrottled)
    return await quickReply(
      msg,
      `Throttled, try again in \`${isThrottled}\` seconds`,
    );

  // Check if the bot has the needed permissions.
  if (command.info.botPermissions) {
    const missingPerms = command.info.botPermissions.filter(
      (x) => !msg.guild?.members.me?.permissions.has(x),
    );

    if (missingPerms.length > 0)
      return await quickReply(
        msg,
        `Missing permissions: \`${missingPerms.join("`, `")}\``,
      );
  }

  respond(msg, timeStart, command?.run);
};

const buttonEvent = async (msg: ButtonInteraction): Promise<void> => {
  const options = msg.customId.split("_");
  const commandName = options[0];
  options.shift();
  msg.customId = options.join("_");

  const command = state.buttons.get(commandName);

  if (!command) return;

  const response = await command.run(msg).catch((e: Error) => {
    console.log(e);
    return {
      ephemeral: true,
      embeds: [errorEmbed],
    } as ReturnMessage;
  });

  if (Object.keys(response).length === 0) return;
  await msg.reply(response).catch(console.error);
};

const respond = async (
  interaction: ChatInputCommandInteraction,
  timeStart: number,
  func: (message: ChatInputCommandInteraction) => Promise<ReturnMessage | void>,
): Promise<void> => {
  const hidden =
    interaction.options.get("hidden") === null
      ? false
      : (interaction.options.get("hidden")?.value as boolean);

  state.throttle.addToThrottle(
    interaction.guildId || "e",
    interaction.user.id,
    interaction.commandName,
  );

  const response = await func(interaction)
    .then((x) => {
      if (!x) return null;
      x.ephemeral = x.ephemeral || hidden;
      return x;
    })
    .catch((e: Error) => {
      console.log(e);
      return {
        ephemeral: true,
        embeds: [errorEmbed],
      } as ReturnMessage;
    });

  const processingDuration = Date.now() - timeStart;

  if (!response) return;
  if (interaction.replied)
    await interaction.followUp(response).catch(console.error);
  else if (interaction.deferred)
    await interaction
      .editReply(response)
      .catch(console.error);
  else await interaction.reply(response).catch(console.error);

  state.log.logCommand(interaction, processingDuration, hidden);

  if (response.callback)
    respond(interaction, 0, response.callback).catch(console.error);
};
