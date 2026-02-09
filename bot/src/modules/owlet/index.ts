import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";
import Controller from "./lib/controller";
import { state } from "@app";
import { formatNumber } from "@lib/number";

export default {
  name: "owlet",
  description: "User interface for the owlet service.",
  initialize,

  stats: async (guildId) => {
    const musicPlayed = await state.db.mediaLog.aggregate({
      _count: { id: true },
      _avg: { progress: true, duration: true },
      _sum: { progress: true, duration: true },
      where: { guildId },
    });

    if (musicPlayed) {
      return {
        name: "Music Usage",
        value: `**Average:** \`${Math.round((musicPlayed._avg.progress || 0) / 1000 / 60)}/${Math.round((musicPlayed._avg.duration || 0) / 1000 / 60,)}\` minutes
                **sum:** \`${formatNumber((musicPlayed._sum.progress || 0) / 1000 / 60)}/${formatNumber((musicPlayed._sum.duration || 0) / 1000 / 60)}\` minutes
                **amount:** \`${formatNumber(musicPlayed._count.id)}\` songs played
            `,
        inline: false,
      };
    }
  },
} as Module;

interface State extends LocalState {
  controller: Controller,
}

const localState = {} as unknown as State;

async function initialize() {
  localState.controller = new Controller();
}

export { localState };
