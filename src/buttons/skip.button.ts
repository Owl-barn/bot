import { MessageEmbed, HexColorString, GuildMember } from "discord.js";
import RavenButton from "../types/button";
import { returnMessage } from "../types/Command";
import { RavenButtonInteraction } from "../types/interaction";

export default class implements RavenButton {
    disabled: boolean;
    name = "skip";

    async execute(msg: RavenButtonInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guild";

        const subscription = msg.client.musicService.get(msg.guildId);
        if (!subscription) return { content: "No song is playing", ephemeral: true };

        const song = subscription.getCurrent()?.url;
        if (!song) return { content: "No song is playing", ephemeral: true };

        subscription.setVoteLock(song);

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        const embed = new MessageEmbed()
            .setColor(process.env.EMBED_COLOR as HexColorString);

        if (song !== subscription.getVoteLock()) {
            msg.update({ embeds: [failEmbed.setDescription("song ended")], components: [] });

            return { content: "" };
        }

        const votes = subscription.getVotes();

        // Check if didnt vote yet.
        if (votes.some(y => y === msg.user.id)) {
            return { embeds: [failEmbed.setDescription("You already voted")], ephemeral: true };
        }

        // Check if in vc.
        const vc = (msg.member as GuildMember).voice.channel;
        if (!vc || !vc.members.some(y => y.id == msg.client.user?.id)) {
            return { embeds: [failEmbed.setDescription("You arent in vc.")], ephemeral: true };
        }

        subscription.addVote(msg.user.id);

        // Get numbers.
        const current = Number((msg.message.embeds[0].description as string).split("/")[0]) + 1;
        const max = (msg.member as GuildMember).voice.channel?.members.size as number - 1;
        const half = Math.ceil(max / 2);

        console.log(`${msg.user.username} voted to skip, now at ${current} was at ${current - 1}`);

        if (current >= half) {
            msg.update(subscription.skip());

            return { content: "" };
        }

        msg.update({ embeds: [embed.setDescription(`${current}/${half}`)] }).catch(console.error);

        return { content: "" };
    }

}