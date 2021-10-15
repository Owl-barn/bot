import { CommandInteraction } from "discord.js";
import RavenClient from "./ravenClient";

export default interface RavenInteraction extends CommandInteraction {
    client: RavenClient;
}