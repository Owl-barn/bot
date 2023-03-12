import { Guild } from "@prisma/client";
import { Module } from "@structs/module";
import { generateLevelArray } from "./lib/generateLevels";

export default {
  name: "level",
  description: "Leveling system.",
} as Module;

const localState = {
  levelArray: generateLevelArray(10000),
  timeout: new Map<string, number>(),
  guilds: new Map<string, Guild>(),
  maxLevel: 1000,
};

export { localState };
