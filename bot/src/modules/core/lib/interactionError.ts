import { state } from "@app";
import { failEmbedTemplate } from "@lib/embedTemplate";

const errorEmbed = (hideInvite = true) => {

  if (hideInvite)
    return failEmbedTemplate(`An error occurred trying to run this command.`);

  else
    return failEmbedTemplate(
      `An error occurred, please make a report of this in [the ${state.env.APP_NAME} discord server](${state.env.SUPPORT_SERVER})`,
    );
};

export { errorEmbed };
