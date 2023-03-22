import { state } from "@app";
import { DefaultAccessConfig, Access } from ".";
import { SubscriptionTierKey } from "./subscription";

interface Response extends DefaultAccessConfig {
  userTier?: SubscriptionTierKey;
  guildTier?: SubscriptionTierKey;

  recommendedGuildSubscriptions: RecommendedSubscription[];
  recommendedUserSubscriptions: RecommendedSubscription[];
}

interface RecommendedSubscription {
  key: SubscriptionTierKey;
  throttleMultiplier: number;
}


async function getUser(id: string) {
  let user = await state.db.user.findUnique({ where: { id } });
  if (user === null)
    user = await state.db.user.create({ data: { id } });

  return user;

}

function mergeSubscriptions(input: Response, config: Access) {
  let output = { ...input } as Response;

  // merge default config
  if (config.default)
    output = { ...output, ...config.default };

  // merge guild config
  const guildTier = output.guildTier ? config[output.guildTier] : undefined;
  if (guildTier)
    output = { ...output, ...guildTier };

  // merge user config
  const userTier = output.userTier ? config[output.userTier] : undefined;
  if (userTier) {

    // merge most lenient throttling
    if (
      (userTier.throttling && output.throttling) &&
      (userTier.throttling.usages / userTier.throttling.duration < output.throttling.usages / output.throttling.duration)
    )
      output.throttling = userTier.throttling;


    output.userAccess = userTier.userAccess;
  }

  return output;
}

function getRecommendSubscriptions(input: Response, config: Access) {
  const output = { ...input } as Response;
  for (const tier of Object.keys(config)) {
    const key = tier as SubscriptionTierKey;
    if (key === "default") continue;

    if (config[key]?.guildAccess)
      output.recommendedGuildSubscriptions.push({
        key,
        throttleMultiplier: 0,
      });

    if (config[key]?.userAccess)
      output.recommendedUserSubscriptions.push({
        key,
        throttleMultiplier: 0,
      });
  }

  return output;
}

export async function getAccessInfo(config: Access | undefined, userId: string, guildId?: string): Promise<Response> {
  let output: Response = {
    userTier: undefined,
    guildTier: undefined,

    throttling: undefined,
    guildThrottling: undefined,
    globalThrottling: undefined,

    guildAccess: true,
    userAccess: true,

    recommendedGuildSubscriptions: [],
    recommendedUserSubscriptions: [],
  };

  // Get user and create if not found.
  const user = await getUser(userId);

  // set user tier
  output.userTier = user.subscriptionTier as SubscriptionTierKey | undefined;

  // get guild tier
  const guild = guildId ? state.guilds.get(guildId) : undefined;
  if (guild)
    output.guildTier = guild.subscriptionTier as SubscriptionTierKey | undefined;

  // if no config is provided, return the default.
  if (config === undefined)
    return output;


  output = mergeSubscriptions(output, config);

  output = getRecommendSubscriptions(output, config);

  return output;
}
