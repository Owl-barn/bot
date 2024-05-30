import type { CommandTreeModule } from "shared/web_api";
import { API_URL } from "$env/static/private";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
    const response = await fetch(`${API_URL}/commands`);
    const commands = await response.json() as CommandTreeModule[];

    return { commands };
}) satisfies PageServerLoad;