import { PrismaClient } from ".prisma/client";
import { Client, Snowflake, Collection } from "discord.js";
import musicService from "../modules/music.service";
import { Command } from "./Command";

export default class RavenClient extends Client {
    commands: Collection<string, Command>;
    musicService: Map<Snowflake, musicService>;
    db: PrismaClient;
}