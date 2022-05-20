import { returnMessage } from "./Command";
import { RavenButtonInteraction } from "./interaction";

export default abstract class RavenButton {
    name: string;
    disabled = false;

    abstract execute(msg: RavenButtonInteraction): Promise<returnMessage>;
}
