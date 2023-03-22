import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";

export default {
  name: "selfrole",
  description: "Self-assignable role system.",
} as Module;

const localState = {} as LocalState;
export { localState };
