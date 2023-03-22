import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";
import { generateLevelArray } from "./lib/generateLevels";
import { LevelArray } from "./structs/levelArray";

export default {
  name: "level",
  description: "Leveling system.",
  initialize,
} as Module;

interface State extends LocalState {
  levelArray: LevelArray[],
  timeout: Map<string, number>,
  maxLevel: number,
}

const localState: State = {
  timeout: new Map(),
  maxLevel: 1000,
} as unknown as State;


export { localState };

async function initialize() {
  localState.levelArray = generateLevelArray(localState.maxLevel);
}
