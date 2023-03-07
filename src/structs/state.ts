import { PrismaClient } from "@prisma/client";
import { Client } from "discord.js";
import { Button } from "./button";
import { CommandEnum } from "./command";

export interface State {
  db: PrismaClient;
  env: typeof import("../modules/env").env;
  client: Client;

  commands: Map<string, CommandEnum>;
  buttons: Map<string, Button>;
}
