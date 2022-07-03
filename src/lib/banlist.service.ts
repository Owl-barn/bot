import { banned_user } from "@prisma/client";
import env from "../modules/env";
import db from "./db.service";

class BannedUsersClass {
    private users: Map<string, banned_user> = new Map();

    public init = async () => {
        const users = await db.banned_user.findMany();

        for (const user of users) {
            this.users.set(user.user_id, user);
        }

        console.log("Loaded banned users.");
    };

    public getBans = () => this.users;

    public isBanned = (userId: string) => this.users.has(userId);

    public ban = async (user_id: string, reason?: string) => {
        const user = await db.banned_user.create({ data: { user_id, reason } });
        this.users.set(user.user_id, user);
        console.log(`Successfully banned ${user.user_id}`.red);
    };

    public unban = async (user_id: string) => {
        const user = await db.banned_user.delete({ where: { user_id } });
        this.users.delete(user.user_id);
        console.log(`Successfully unbanned ${user.user_id}`.yellow);
    };
}

declare const global: NodeJS.Global & { bannedUsers: BannedUsersClass };
const bannedUsers: BannedUsersClass =
    global.bannedUsers || new BannedUsersClass();
if (env.isDevelopment) global.bannedUsers = bannedUsers;

export default bannedUsers;
