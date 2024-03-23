import { state } from "@app";
import { createLogger, transports, format } from "winston";

const { printf } = format;

const consoleFormat = printf(({ level, message, label, timestamp }) => {
  const renderedLabel = label ?? "main";
  return `${timestamp} [${renderedLabel}] ${level}: ${message}`;
});

const logFileFormat = format.combine(
  format.uncolorize(),
  format.timestamp(),
  format.json(),
);


export const loadLogger = () =>
  state.log = createLogger({
    transports: [
      new transports.Console({
        level: state.env.LOG_LEVEL,
        handleExceptions: true,
        handleRejections: true,
        format: format.combine(
          format.timestamp({ format: "HH:mm:ss" }),
          format.colorize(),
          consoleFormat,
        ),
      }),

      // Info
      new transports.File({
        level: "debug",
        dirname: "logs",
        filename: "combined.log",
        format: logFileFormat,
      }),

      // Error
      new transports.File({
        level: "error",
        dirname: "logs",
        filename: "error.log",
        handleExceptions: true,
        handleRejections: true,
        format: logFileFormat,
      }),
    ],
  });

