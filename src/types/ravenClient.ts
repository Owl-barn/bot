import { PrismaClient } from ".prisma/client";
import Collection from "@discordjs/collection";
import { Client } from "discord.js";
import { Command } from "./Command";

export default class RavenClient extends Client {
    commands: Collection<string, Command>;
    voiceService: unknown;
    db: PrismaClient;
}