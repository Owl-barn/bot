import { PrismaClient } from "@prisma/client";
import { Client } from "discord.js";
import RavenButton from "src/types/button";
import { CommandEnum } from "src/types/Command";

export interface State {
  db: PrismaClient;
  env: typeof import("../modules/env").env;
  client: Client;

  commands: Map<string, CommandEnum>;
  buttons: Map<string, RavenButton>;

  // Services.
  owlet: any;
}
