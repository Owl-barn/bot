import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";

export default {
  name: "moderation",
  description: "Moderation functionality for the bot.",
} as Module;

const localState = {} as LocalState;
export { localState };
