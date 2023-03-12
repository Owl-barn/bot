import { Module } from "@structs/module";
import { generateLevelArray } from "./lib/generateLevels";
import { LevelArray } from "./structs/levelArray";

export default {
  name: "level",
  description: "Leveling system.",
  initialize,
} as Module;

interface LocalState {
  levelArray: LevelArray[],
  timeout: Map<string, number>,
  maxLevel: number,
}

const localState: LocalState = {
  timeout: new Map(),
  maxLevel: 1000,
} as unknown as LocalState;

async function initialize() {
  localState.levelArray = generateLevelArray(localState.maxLevel);
}

export { localState };
