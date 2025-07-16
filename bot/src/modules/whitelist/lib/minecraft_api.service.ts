import axios, { AxiosResponse } from "axios";
import { localState } from "..";

export class MinecraftUser {
  public id: string;
  public name: string;

  constructor(id: string, username: string) {
    this.id = id;
    this.name = username;
  }

  // get account by username
  public static async fromUsername(username: string): Promise<MinecraftUser | null> {
    const response = await axios.get(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${username}`);
    return this.processResponse(response);
  }

  // get account by id
  public static async fromId(id: string): Promise<MinecraftUser | null> {
    const response = await axios.get(`https://api.minecraftservices.com/minecraft/profile/lookup/${id}`);
    return this.processResponse(response);
  }

  private static processResponse(response: AxiosResponse): MinecraftUser | null {
    if (response.status !== 200) return null;

    const data = response.data;
    if (!data || !data.id || !data.name) {
      localState.log.error("Invalid response from Minecraft API", { data });
      return null;
    }

    return new MinecraftUser(data.id, data.name);
  }
}
