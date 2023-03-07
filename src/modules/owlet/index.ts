import { Module } from "@src/structs/module";
import Controller from "./lib/controller";

export default {
  name: "owlet",
  description: "User interface for the owlet service.",
  version: "0.0.1",
} as Module;

const localState = {
  controller: new Controller(),
};

export { localState };
