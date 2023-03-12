import { Module } from "@structs/module";
import Controller from "./lib/controller";

export default {
  name: "owlet",
  description: "User interface for the owlet service.",
  initialize,
} as Module;

interface LocalState {
  controller: Controller,
}

const localState = {} as unknown as LocalState;

async function initialize() {
  localState.controller = new Controller();
}

export { localState };
