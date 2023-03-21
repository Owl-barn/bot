import { state } from "@app";
import { CommandStruct } from "@structs/command";
import { Commands } from "commands";
import { BaseMessage } from "./server/message";

export function processCommand(data: BaseMessage<any>) {
  let command = state.commands.get(data.command);
  if (!command) {
    state.log.main.log("warn", `Command "${data.command}" not found.`);
    return;
  }

  runCommand(command, data);
}

export function runCommand(command: CommandStruct<keyof Commands>, data: BaseMessage<any>) {
  command.run(data.data)
    .then((response) => {
      state.log.main.info(`Command "${data.command}" executed successfully.`);
      state.server.broadcast("CommandResponse", response, data.mid);
    })
    .catch((error) => {
      state.log.main.error(`Command "${data.command}" failed to execute:`, error);
      state.server.broadcast("CommandResponse", { error: error.message }, data.mid);
    });
}
