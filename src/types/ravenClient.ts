import { PrismaClient } from ".prisma/client";
import { Client, Collection, ClientOptions } from "discord.js";
import musicService from "../modules/music.service";
import RavenButton from "./button";
import { Command, ParentCommand, SubCommand, SubCommandGroup } from "./Command";
type CommandList = ParentCommand | SubCommandGroup | SubCommand | Command;

export default class RavenClient extends Client {
    constructor(options: ClientOptions) {
        super(options);
    }
    commands: Collection<string, CommandList>;
    buttons: Collection<string, RavenButton>;
    musicService: musicService;
    db: PrismaClient;
}
