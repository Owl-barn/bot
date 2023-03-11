import { Module } from "@structs/module";
import { Controller } from "./lib/voiceNotify";

export default {
  name: "notify",
  description: "Friend notification system.",
} as Module;

const localState = {
  controller: new Controller(),
};

export { localState };
