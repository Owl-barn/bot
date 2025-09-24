import { state } from "@app";

export interface RconGuild {
  host: string
  port: number
  password: string
  roleId: string
}

export const getConfig = async (id: string) => {
  const config = await state.db.guild.findFirst({
    where: {
      id,
      rconEnabled: true,
      NOT: [
        { rconHost: null },
        { rconPassword: null },
        { rconRoleId: null },
      ],
    },
  });

  if (!config) return null;

  return {
    host: config.rconHost,
    port: config.rconPort,
    password: config.rconPassword,
    roleId: config.rconRoleId,
  } as RconGuild;
};

