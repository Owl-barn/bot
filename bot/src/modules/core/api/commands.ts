import { state } from "@app";
import { endpoint } from "@structs/endpoint";

export default endpoint({
  GET: {
    name: "commands",
    run: () => {
      return state.commandTree;
    },
  },
});
