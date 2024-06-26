import { state } from "@app";

export async function initializeServer() {
  try {
    await state.webServer.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    state.webServer.log.error(err);
    console.error(err);
    process.exit(1);
  }

}
