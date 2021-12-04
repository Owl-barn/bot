import { Message } from "discord.js";
import registerCommand from "../modules/command.register";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "messageCreate";
    once = false;

    async execute(msg: Message): Promise<void> {
        if (!msg) return;

        if (msg.content === "innit*" && msg.member?.id === "140762569056059392") {
            const client = msg.client as RavenClient;
            registerCommand(client.commands, client.user!.id, msg.guild!.id);
        }
    }
}