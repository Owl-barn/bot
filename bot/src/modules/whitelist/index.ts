import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";

export default {
  name: "whitelist",
  description: "minecraft whitelist system.",
} as Module;

const localState = {} as LocalState;
export { localState };
