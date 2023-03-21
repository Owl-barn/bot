import { createLogger, transports } from "winston";

const loadLogger = createLogger({
  transports: [
    new transports.Console({ debugStdout: false }),
    new transports.File({ filename: "combined.log" })
  ]
});

export { loadLogger };
