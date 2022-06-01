import { EmbedBuilder, HexColorString, GuildMember } from "discord.js";
import RavenButton from "../types/button";
import { returnMessage } from "../types/Command";
import { RavenButtonInteraction } from "../types/interaction";

export default class implements RavenButton {
    disabled: boolean;
    name = "skip";

    async execute(msg: RavenButtonInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guild";
        const skipID = msg.customId.split("_")[1];
        const member = msg.member as GuildMember;

        const failEmbed = new EmbedBuilder().setColor(
            process.env.EMBED_FAIL_COLOR as HexColorString,
        );

        const ended = {
            embeds: [failEmbed.setDescription("Song ended.")],
            components: [],
        };

        const embed = new EmbedBuilder().setColor(
            process.env.EMBED_COLOR as HexColorString,
        );

        const subscription = msg.client.musicService.get(msg.guildId);
        const currentSong = subscription?.getCurrent();

        if (!subscription || !currentSong?.id) {
            msg.update(ended);

            return { content: "" };
        }

        const voteLock = subscription.getVoteLock();

        if (skipID !== voteLock?.id) {
            msg.update(ended);

            return { content: "" };
        }

        // Check if in vc.
        const vc = member.voice.channel;
        if (!vc || !vc.members.some((y) => y.id == msg.client.user?.id)) {
            return {
                embeds: [failEmbed.setDescription("You arent in vc.")],
                ephemeral: true,
            };
        }

        let votes = subscription.getVotes();

        // Check if didnt vote yet.
        votes = votes.has(msg.user.id)
            ? subscription.removeVote(msg.user.id)
            : subscription.addVote(msg.user.id);

        // Remove votes of people that left VC.
        votes.forEach((vote) => {
            if (!vc.members.has(vote)) subscription.removeVote(vote);
        });

        // Get numbers.
        const current = votes.size;
        const max = (member.voice.channel?.members.size as number) - 1;
        const half = Math.ceil(max / 2);

        if (current >= half) {
            msg.update(subscription.skip());

            return { content: "" };
        }

        embed
            .setTitle("Vote skip song")
            .addField(
                "Song to skip",
                `*[${currentSong.title.formatted}](${currentSong.url})*`,
                true,
            )
            .addField("Votes needed", `${current}/${half}`, true);

        msg.update({ embeds: [embed] }).catch(console.error);

        return { content: "" };
    }
}
