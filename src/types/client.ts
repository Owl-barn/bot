import { Player } from "discord-player";
import discord, { ClientOptions } from "discord.js";
import MusicPlayer from "../music/manager";

export default class Client extends discord.Client {
    constructor(options: ClientOptions) {
        super(options);
    }

    player: MusicPlayer;
}
