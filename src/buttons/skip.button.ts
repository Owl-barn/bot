import { MessageEmbed, HexColorString, GuildMember } from "discord.js";
import RavenButton from "../types/button";
import { returnMessage } from "../types/Command";
import { RavenButtonInteraction } from "../types/interaction";

export default class implements RavenButton {
    disabled: boolean;
    name = "skip";

    async execute(msg: RavenButtonInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guild";
        const skipID = msg.customId.split("_")[1];

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        const embed = new MessageEmbed()
            .setColor(process.env.EMBED_COLOR as HexColorString);

        const subscription = msg.client.musicService.get(msg.guildId);
        const currentSong = subscription?.getCurrent();

        if (!subscription || !currentSong?.id) {
            return { content: "No song is playing", ephemeral: true };
        }

        const voteLock = subscription.getVoteLock();

        if (skipID !== voteLock?.id) {
            msg.update({ embeds: [failEmbed.setDescription("Song ended.")], components: [] });

            return { content: "" };
        }

        // Check if in vc.
        const vc = (msg.member as GuildMember).voice.channel;
        if (!vc || !vc.members.some(y => y.id == msg.client.user?.id)) {
            return { embeds: [failEmbed.setDescription("You arent in vc.")], ephemeral: true };
        }

        let votes = subscription.getVotes();
        const originalCount = votes.size;

        // Check if didnt vote yet.
        if (votes.has(msg.user.id)) {
            votes = subscription.removeVote(msg.user.id);
        } else {
            votes = subscription.addVote(msg.user.id);
        }

        // Get numbers.
        const current = votes.size;
        const max = (msg.member as GuildMember).voice.channel?.members.size as number - 1;
        const half = Math.ceil(max / 2);

        console.log(`${msg.user.username} vote set, now at ${current} was at ${originalCount}`);

        if (current >= half) {
            msg.update(subscription.skip());

            return { content: "" };
        }

        embed
            .addField("Song to skip", `*[${currentSong.title}](${currentSong.url})*`)
            .setDescription(`${current}/${half}`);

        msg.update({ embeds: [embed] }).catch(console.error);

        return { content: "" };
    }

}