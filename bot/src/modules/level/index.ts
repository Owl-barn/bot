import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";
import { LevelController } from "./lib/level";

export default {
  name: "level",
  description: "Leveling system.",
  initialize,
} as Module;

interface State extends LocalState {
  controller: LevelController,
  maxLevel: number,
}

const localState: State = {
  maxLevel: 1000,
} as unknown as State;


export { localState };

async function initialize() {
  localState.controller = new LevelController();
}
