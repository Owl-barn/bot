import type { Stats } from "../structs/stats";
import type { LayoutServerLoad } from "./$types";

export const load = (async () => {
    const response = await fetch("http://hootsifer_bot:3000/stats");
    const stats = await response.json() as Stats;

    return { stats };
}) satisfies LayoutServerLoad;
