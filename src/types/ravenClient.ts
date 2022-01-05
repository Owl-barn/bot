import { PrismaClient } from ".prisma/client";
import { Client, Snowflake, Collection } from "discord.js";
import musicService from "../modules/music.service";
import RavenButton from "./button";
import { Command } from "./Command";

export default class RavenClient extends Client {
    commands: Collection<string, Command>;
    buttons: Collection<string, RavenButton>;
    musicService: Map<Snowflake, musicService>;
    db: PrismaClient;
}