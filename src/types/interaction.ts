import { ButtonInteraction, CommandInteraction } from "discord.js";
import RavenClient from "./ravenClient";

export default interface RavenInteraction extends CommandInteraction {
    client: RavenClient;
}

export interface RavenButtonInteraction extends ButtonInteraction {
    client: RavenClient;
}