import { ButtonInteraction, CommandInteraction } from "discord.js";
import RavenClient from "./ravenClient";

export interface RavenButtonInteraction extends ButtonInteraction {
    client: RavenClient;
}

export default interface RavenInteraction extends CommandInteraction {
    client: RavenClient;
    // eslint-disable-next-line semi
}
