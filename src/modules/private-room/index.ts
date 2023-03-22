import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";
import { Controller } from "./lib/controller";


interface State extends LocalState {
  controller: Controller,
}

const localState = {
  controller: new Controller(),
} as State;

export { localState };

export default {
  name: "private-room",
  description: "Private room system.",
  initialize: localState.controller.initialize,
} as Module;
