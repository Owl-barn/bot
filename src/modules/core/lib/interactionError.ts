import { state } from "@app";
import { failEmbedTemplate } from "@lib/embedTemplate";

const errorEmbed = failEmbedTemplate(
  `An error occurred, please make a report of this in [the Raven bot discord server](${state.env.SUPPORT_SERVER})`,
);

export { errorEmbed };