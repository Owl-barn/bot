import { Player } from "discord-player";
import discord, { ClientOptions } from "discord.js";

export default class Client extends discord.Client {
    constructor(options: ClientOptions) {
        super(options);
    }

    player: Player;
}
