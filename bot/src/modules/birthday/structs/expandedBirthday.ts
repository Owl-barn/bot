import { UserGuildConfig, Guild, User } from "@prisma/client";

export type ExpandedBirthday = UserGuildConfig & { guild: Guild, user: User };
