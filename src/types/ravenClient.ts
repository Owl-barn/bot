import { PrismaClient } from ".prisma/client";
import Collection from "@discordjs/collection";
import { Client, Snowflake } from "discord.js";
import musicService from "../modules/music.service";
import { Command } from "./Command";

export default class RavenClient extends Client {
    commands: Collection<string, Command>;
    musicService: Map<Snowflake, musicService>;
    db: PrismaClient;
}