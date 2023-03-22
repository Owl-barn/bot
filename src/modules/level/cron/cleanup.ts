import { cron } from "@structs/cron";
import { localState } from "..";

export default cron(
  {
    name: "cleanup",
    time: "0 * * * *",
  },

  async () => {
    localState.log.debug("Running cleanup cron job...");
    localState.timeout = new Map();
  },
);
