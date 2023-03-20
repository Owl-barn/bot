import { cron } from "@structs/cron";
import { localState } from "..";

export default cron(
  {
    name: "cleanup",
    time: "0 * * * *",
  },

  async () => {
    localState.timeout = new Map();
  },
);
