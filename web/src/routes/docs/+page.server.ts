import type { CommandTreeModule } from "shared/src/web_api";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
    const response = await fetch("http://hootsifer_bot:3000/commands");
    const commands = await response.json() as CommandTreeModule[];

    return { commands };
}) satisfies PageServerLoad;