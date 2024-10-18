import { cron } from "@structs/cron";
import { localState } from "..";

export default cron(
  {
    name: "cleanup",
    time: "*/1 * * * *",
  },

  async () => {
    await localState.controller.vcLoop();
  },
);
