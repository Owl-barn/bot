import { ApplicationCommandPermissionData, Message } from "discord.js";
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums";
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
            const commands = client.commands;
            registerCommand(client.commands, client.user!.id, msg.guild!.id);

            const botOwner = {
                id: process.env.OWNER_ID as string,
                type: ApplicationCommandPermissionTypes.USER,
                permission: true,
            };

            const serverOwner = {
                id: msg.guild?.ownerId as string,
                type: ApplicationCommandPermissionTypes.USER,
                permission: true,
            };

            const interactions = await msg.guild?.commands.fetch();

            interactions?.forEach(x => {
                const command = commands.get(x.name);
                const permissions: ApplicationCommandPermissionData[] = [];

                permissions.push(botOwner);

                if (command?.group !== "owner") permissions.push(serverOwner);

                x.permissions.set({ permissions });
            });
        }
    }
}