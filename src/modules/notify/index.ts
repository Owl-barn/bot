import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";
import { Controller } from "./lib/voiceNotify";

export default {
  name: "notify",
  description: "Friend notification system.",
} as Module;

interface State extends LocalState {
  controller: Controller,
}

const localState = {
  controller: new Controller(),
} as State;

export { localState };
