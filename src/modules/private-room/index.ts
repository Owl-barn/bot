import { Module } from "@structs/module";
import { Controller } from "./lib/controller";

const localState = {
  controller: new Controller(),
};

export { localState };

export default {
  name: "private-room",
  description: "Private room system.",
  initialize: localState.controller.initialize,
} as Module;
