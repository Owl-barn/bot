import { API_URL } from "$env/static/private";
import type { Stats } from "../structs/stats";
import type { LayoutServerLoad } from "./$types";

export const load = (async () => {
    const response = await fetch(`${API_URL}/stats`);
    const stats = await response.json() as Stats;

    return { stats };
}) satisfies LayoutServerLoad;
