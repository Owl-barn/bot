import { Button } from "@structs/button";
import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { canForce, isWithBot } from "../../lib/isdj";
import { getOwlet } from "../../lib/getBot";
import { getAvatar } from "@lib/functions";
import { EmbedAuthorOptions } from "discord.js";
import { generateButtons } from "@modules/owlet/commands/play";

export default Button(

  {
    name: "track_bump",
    isGlobal: false,
  },

  async (msg) => {
    if (!msg.guildId) throw "No guild";

    const query = msg.customId.trim();

    const failEmbed = failEmbedTemplate();

    if (!isWithBot(msg.member)) {
      failEmbed.setDescription("Please join voicechat with the bot to use this functionality.");
      return { embeds: [failEmbed], ephemeral: true };
    }

    const { owlet, bot } = await getOwlet(msg.guild, msg.member.voice.channel);
    const author: EmbedAuthorOptions = {
      name: "Bump",
      iconURL: getAvatar(bot),
    };

    failEmbed.setAuthor(author)
      .setFooter({
        text: msg.user.username,
        iconURL: getAvatar(msg.member),
      });


    if (!canForce(msg.member, owlet, true)) {
      failEmbed.setDescription("you need the `DJ` role to do that.");
      return { embeds: [failEmbed], ephemeral: true };
    }


    const embed = embedTemplate()
      .setAuthor(author)
      .setFooter({
        text: msg.user.username,
        iconURL: getAvatar(msg.member),
      });

    // Send the command to the bot.
    const response = await owlet.runCommand(
      "Bump",
      {
        guildId: msg.guildId,
        userId: msg.user.id,
        query,
      },
      msg.id
    );

    // Handle errors.
    if (response.error) {
      failEmbedTemplate(response.error).setAuthor(author);
      failEmbed.setDescription(response.error);
      return { embeds: [failEmbed], ephemeral: true };
    }

    embed.setDescription(`Bumped [${response.track.title}](${response.track.url}) up the queue.`);
    await msg.update({ components: [generateButtons(query)] });

    return { embeds: [embed] };
  }

);
