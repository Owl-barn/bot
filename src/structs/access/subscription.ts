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
    guildLimit: 0,
  },
  2: {
    name: "Chicken",
    guildLimit: 3,
  },
  3: {
    name: "Cockatiel",
    guildLimit: 1,
  },
  100: {
    name: "Owl",
    guildLimit: 100,
    locked: true,
  },
};

export { subscriptionTiers };

export type SubscriptionTierKey = keyof typeof subscriptionTiers | "default";
