import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";

export default {
  name: "birthday",
  description: "Birthday system.",
} as Module;


const localState = {} as LocalState;
export { localState };
