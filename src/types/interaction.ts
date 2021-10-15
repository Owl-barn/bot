import { Interaction } from "discord.js";
import RavenClient from "./ravenClient";

export default interface RavenInteraction extends Interaction {
    client: RavenClient;
}