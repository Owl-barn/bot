import axios from "axios";
import { Rcon } from "rcon-client/lib";
import RavenInteraction from "../types/interaction";

export async function getMcUUID(username: string): Promise<boolean | string> {
    let code = false;
    await axios
        .get(`https://api.mojang.com/users/profiles/minecraft/${username}`)
        .then((response) => {
            code = response.status === 200 ? response.data.id : false;
        });
    return code;
}

export const defaultErr = { type: "text", content: "an error occured" };

export async function getMcName(uuid: string): Promise<string | false> {
    let userName = false;
    const url =
        "https://sessionserver.mojang.com/session/minecraft/profile/" + uuid;
    await axios.get(url).then((response) => {
        userName = response.status === 200 ? response.data.name : false;
    });
    if (userName) return userName;
    throw "Couldnt resolve uuid";
}

export async function RCONHandler(
    command: string,
    login: RCONLogin,
): Promise<{ message: string; code: string }> {
    const rcon = await Rcon.connect({
        host: login.host,
        port: login.port,
        password: login.password,
    }).catch(() => {
        return false;
    });
    if (typeof rcon == "boolean") {
        return { message: "Minecraft server unreachable", code: "MC_CONN_ERR" };
    }
    // Execute command.
    const response = await rcon.send(command);
    // End connection.
    rcon.end();
    // Return.
    return {
        message: response,
        code: `${response.startsWith("Added") ? "SUCCESS" : "GENERIC_ERR"}`,
    };
}

export async function massRename(msg: RavenInteraction): Promise<void> {
    const users = await msg.client.db.whitelist.findMany();

    for (const user of users) {
        try {
            const dcUser = await msg.guild?.members.fetch(user.user_id);
            const mcName = await getMcName(user.mc_uuid);

            if (!mcName || !dcUser) throw "missing";

            await dcUser.setNickname(mcName);

            console.log(`mass rename success: ${user.user_id}`.green);
        } catch (e) {
            console.error(e);
            console.log(`mass rename entry failed: ${user.user_id}`.red);
        }
    }
}

export type RCONLogin = {
    host: string;
    port: number;
    password: string;
};
