import { state } from "@app";
import { createLogger, transports, format } from "winston";
import os from "os";

const ignoreToken = format((info) => {
  if (!info.data) return info;
  const data = { ...info.data.data };

  if (data?.token) data.token = "REDACTED";
  if (data?.password) data.password = "REDACTED";
  return {
    ...info,
    data: {
      ...info.data,
      data,
    }
  };
});

const { printf } = format;
const consoleFormat = printf(({ level, message, label, timestamp }) => {
  const renderedLabel = label ?? "main";
  return `${timestamp} [${renderedLabel}] ${level}: ${message}`;
});

const hostname = os.hostname();

export const loadLogger = () => createLogger({
  transports: [
    new transports.Console({
      level: state.env.LOG_LEVEL,
      handleExceptions: true,
      handleRejections: true,
      format: format.combine(
        format.timestamp({ format: "HH:mm:ss" }),
        format.colorize(),
        consoleFormat,
      )
    }),

    new transports.File({
      level: "debug",
      dirname: "logs",
      filename: `${hostname}.combined.log`,
      format: format.combine(
        ignoreToken(),
        format.json(),
      )
    }),

    new transports.File({
      level: "error",
      dirname: "logs",
      filename: `${hostname}.error.log`,
      handleExceptions: true,
      handleRejections: true,
      format: format.combine(
        ignoreToken(),
        format.json(),
      )
    })
  ]
});

