import { GuildMember, HexColorString, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { isDJ } from "../../lib/functions.service";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "skip",
            description: "skips a song",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

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

        const dj = isDJ(member);

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        if (vc === null) return { embeds: [failEmbed.setDescription("Join a voicechannel first.")] };

        const subscription = msg.client.musicService.get(member.guild.id);

        const currentSong = subscription?.getCurrent();

        if (!subscription || subscription.destroyed || !currentSong) return { embeds: [failEmbed.setDescription("No music is playing")] };

        const voteLock = subscription.getVoteLock();

        const isRequester = currentSong.user.id == msg.user.id;

        if (voteLock && !(dj || isRequester)) return { embeds: [failEmbed.setDescription("Vote already in progress.")] };

        if (index) {
            const queue = subscription.getQueue();
            if (queue.length <= index - 1) return { embeds: [failEmbed.setDescription("Out of range.")] };
            if (queue[index - 1].user.id === msg.user.id || (dj && force)) {
                return subscription.skip(index);
            }

            return { embeds: [failEmbed.setDescription("Can't index skip a song you didnt add.")] };
        }

        if ((dj && force) || vc.members.size <= 3 || isRequester) return subscription.skip();

        subscription.setVoteLock();
        subscription.addVote(msg.user.id);

        const component = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`skip_${currentSong.id}`)
                    .setLabel("vote skip")
                    .setStyle("PRIMARY"),
            );


        const embed = new MessageEmbed()
            .setTitle("Vote skip song")
            .addField("Song to skip", `**[${currentSong.title.formatted}](${currentSong.url})**`, true)
            .addField("Votes needed", `1/${Math.ceil((vc.members.size - 1) / 2)}`, true)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed], components: [component] };
    }

};