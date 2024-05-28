import { state } from "@app";
import Fastify from "fastify";

export async function initializeServer() {
  const fastify = Fastify();

  fastify.get("/", async (request, reply) => {
    console.log("GET /");
    return state.commandTree;
  });

  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

}
