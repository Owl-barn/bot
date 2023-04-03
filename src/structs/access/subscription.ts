export interface SubscriptionTier {
  name: string;
  guildLimit: number;
  locked?: boolean;
}

const subscriptionTiers = {
  "default": {
    name: "Default",
    guildLimit: 0,
  },
  1: {
    name: "Pigeon",
    guildLimit: 2,
  },
  2: {
    name: "Chicken",
    guildLimit: 4,
  },
  3: {
    name: "Cockatiel",
    guildLimit: 1,
  },
  999: {
    name: "Owl",
    guildLimit: 999,
    locked: true,
  },
};

export { subscriptionTiers };

export type SubscriptionTierKey = keyof typeof subscriptionTiers | "default";
