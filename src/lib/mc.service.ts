import axios from "axios";
import { Rcon } from "rcon-client/lib";

export async function getMcUUID(username: string): Promise<boolean | string> {
    let code = false;
    await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`)
        .then(response => {
            code = response.status === 200 ? response.data.id : false;
        });
    return code;
}

export const defaultErr = { type: "text", content: "an error occured" };

export async function getMcName(uuid: string): Promise<string | false> {
    let userName = false;
    await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)
        .then(response => {
            userName = response.status === 200 ? response.data.name : false;
        });
    return userName;
}

export async function RCONHandler(command: string, login: RCONLogin): Promise<{ message: string, code: string }> {
    const rcon = await Rcon.connect({ host: login.host, port: login.port, password: login.password }).catch(() => { return false; });
    if (typeof (rcon) == "boolean") { return { message: "Minecraft server unreachable", code: "MC_CONN_ERR" }; }
    // Execute command.
    const response = await rcon.send(command);
    // End connection.
    rcon.end();
    // Return.
    return { message: response, code: `${response.startsWith("Added") ? "SUCCESS" : "GENERIC_ERR"}` };
}

export type RCONLogin = {
    host: string;
    port: number;
    password: string;
}