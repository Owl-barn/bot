import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";

export default {
  name: "core",
  description: "Core functionality for the bot.",
} as Module;

const localState = {} as LocalState;
export { localState };
