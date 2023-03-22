import { state } from "@app"
import { Guild } from "@prisma/client"


export interface RconGuild extends Guild {
  rconHost: string
  rconPassword: string
}

export const getConfig = async (id: string) => {
  const config = await state.db.guild.findFirst({
    where: {
      id,
      rconEnabled: true,
      NOT: [
        { rconHost: null },
        { rconPassword: null },
      ]
    }
  }) as RconGuild | null
  return config
}

