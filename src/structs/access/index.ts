import { SubscriptionTierKey } from "./subscription";
import { Throttling } from "./throttling";


export interface AccessConfig {
  // Throttling
  throttling?: Throttling | null;
  guildThrottling?: Throttling | null;

  // Access
  guildAccess?: boolean;
  userAccess?: boolean;
}

export interface DefaultAccessConfig extends AccessConfig {
  globalThrottling?: Throttling;
}

export type Access =
  { [x in SubscriptionTierKey]?: Partial<AccessConfig>; } &
  { default: DefaultAccessConfig };

