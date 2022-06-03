import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import RavenClient from "./ravenClient";

export interface RavenButtonInteraction extends ButtonInteraction {
    client: RavenClient;
}

export default interface RavenInteraction extends ChatInputCommandInteraction {
    client: RavenClient;
    // eslint-disable-next-line semi
}
