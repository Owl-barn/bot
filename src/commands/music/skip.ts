import { GuildMember, MessageActionRow, MessageButton, MessageComponentInteraction } from "discord.js";
import musicService from "../../modules/music.service";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "skip",
            description: "skips a song",
            group: "music",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.integer,
                    name: "index",
                    description: "which song to skip",
                    required: false,
                },
                {
                    type: argumentType.boolean,
                    name: "force",
                    description: "force skip?",
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 2,
            },
        });
    }

    public execute = async (msg: RavenInteraction): Promise<returnMessage> => {
        const member = msg.member as GuildMember;
        const vc = member.voice.channel;

        const index = msg.options.getInteger("index");
        const force = msg.options.getBoolean("force");

        const isDJ = member?.roles.cache.some(role => role.name === "DJ");

        if (vc === null) return { content: "Join a voicechannel first." };

        const subscription = msg.client.musicService.get(member.guild.id);
        if (!subscription) return { content: "No music is playing" };

        if (subscription.getVoteLock()) return { content: "Vote already in progress." };

        // DJ and force, less than 2 people in vc, user that added song.
        if ((isDJ && force) || vc.members.size <= 3 ||
            subscription.getCurrent().user.id == msg.user.id
        ) return this.skip(subscription, index);

        if (!isDJ && index) return { content: "You need the DJ role to do this." };

        const component = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("vote")
                    .setLabel("vote skip")
                    .setStyle("PRIMARY"),
            );

        return { content: `0/${Math.floor((vc.members.size - 1) / 2)}`, components: [component], callback: this.callback };
    }

    public callback = async (interaction: RavenInteraction) => {
        const filter = (i: MessageComponentInteraction) => i.customId === "vote";
        const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 45000 });

        const voted: string[] = [];

        const subscription = interaction.client.musicService.get((interaction.member as GuildMember).guild.id);

        if (!subscription) return;

        const song = subscription.getCurrent().url;

        subscription.setVoteLock(song);

        collector?.on("collect", async (x) => {
            try {
                if (x.customId !== "vote") return;

                if (song !== subscription.getVoteLock()) {
                    x.update({ content: "song ended", components: [] });

                    return;
                }

                // Check if didnt vote yet.
                if (voted.some(y => y === x.user.id)) { return; }
                voted.push(x.user.id);

                // Check if in vc.
                const vc = (x.member as GuildMember).voice.channel;
                if (!vc) return;
                if (!vc.members.some(y => y.id == x.client.user?.id)) return;

                // Get numbers.
                const current = Number(x.message.content.split("/")[0]) + 1;
                const max = (x.member as GuildMember).voice.channel?.members.size as number - 1;
                const half = Math.floor(max / 2);

                console.log(`${x.user.username} voted to skip, now at ${current} was at ${current - 1}`);

                if (current >= half) {
                    x.update(this.skip(subscription));

                    return;
                }

                x.update({ content: `${current} /${half}` }).catch(console.error);
            } catch (e) {
                console.error(e);
            }
        });

        collector?.once("end", () => {
            // reset votelock if still set.
            if (subscription.getVoteLock() !== song) return;
            subscription.setVoteLock("");
        });
    }

    private skip = (subscription: musicService, index?: number | null): returnMessage => {
        const queue = subscription.getQueue();
        if (!index) subscription.player.stop();
        else if (index > queue.length) return { content: `Out of range` };
        else queue.splice(index, 1);

        return { content: `Song skipped!`, components: [] };
    }
};