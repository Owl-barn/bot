const baseAccessConfig = {

  default: {
    throttling: {
      duration: 30,
      usages: 6,
    },

    guildThrottling: {
      duration: 1800, // 30 minutes
      usages: 6,
    },
  },

  1: {
    guildThrottling: null,
  },

};

export { baseAccessConfig };
