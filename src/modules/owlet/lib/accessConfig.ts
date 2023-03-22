import { Access } from "@structs/access";

const baseAccessConfig: Access = {

  default: {
    guildAccess: false,
    userAccess: false,

    throttling: {
      duration: 30,
      usages: 6,
    },
  },

  1: {
    guildAccess: true,
    userAccess: true,
  },

};

export { baseAccessConfig };
