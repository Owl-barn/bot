import RavenButton from "../types/button";
import { returnMessage } from "../types/Command";
import { RavenButtonInteraction } from "../types/interaction";

export default class implements RavenButton {
    disabled: boolean;
    name = "delete";

    async execute(msg: RavenButtonInteraction): Promise<returnMessage> {
        const user = msg.customId.trim();

        if (msg.user.id !== user) return {};

        const deleted = await msg.message.delete().catch(() => null);
        if (deleted === null) {
            await msg.update({ components: [] });
        }

        return {};
    }
}
