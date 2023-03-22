import { AccessConfig } from "@structs/access";

const adminAccess: AccessConfig = {
  guildAccess: true,
  userAccess: true,
  throttling: null,
  guildThrottling: null,
};

export { adminAccess };
