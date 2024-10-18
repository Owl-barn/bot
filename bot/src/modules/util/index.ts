import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";

export default {
  name: "util",
  description: "Utility commands for the bot.",
} as Module;

const localState = {} as LocalState;
export { localState };
