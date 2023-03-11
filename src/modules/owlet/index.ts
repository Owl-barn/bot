import { Module } from "@structs/module";
import Controller from "./lib/controller";

export default {
  name: "owlet",
  description: "User interface for the owlet service.",
} as Module;

const localState = {
  controller: new Controller(),
};

export { localState };
