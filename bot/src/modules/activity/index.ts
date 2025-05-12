import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";

export default {
  name: "Activity",
  description: "Activity tracking.",
  isHidden: true,
} as Module;

interface State extends LocalState {
  messageDebounce: Set<string>;
  voiceDebounce: Set<string>;
}

const localState: State = {
  messageDebounce: new Set<string>(),
  voiceDebounce: new Set<string>(),
} as unknown as State;

export { localState };
