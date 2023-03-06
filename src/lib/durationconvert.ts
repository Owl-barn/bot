import { escapeMarkdown } from "discord.js";

/**
 *  Converts a duration string to ms.
 * @param duration Duration to convert, formatted as `00d00h00m`
 * @returns duration in milliseconds.
 */
export default function stringDurationToMs(duration: string): number {
  const durationCheck = new RegExp(
    /((?<days>[0-9]{1,4}) ?(?:d) ?)?((?<hours>[0-9]{1,4}) ?(?:h) ?)?((?<minutes>[0-9]{1,4}) ?(?:m))?/g,
  );

  duration = escapeMarkdown(duration).trim();
  const match = Array.from(duration.matchAll(durationCheck));

  let { days, hours, minutes } = match[0].groups as unknown as TimeInput;

  if (!days && !hours && !minutes) return 0;

  days = Number(days);
  hours = Number(hours);
  minutes = Number(minutes);

  let durationMs = 0;

  durationMs += days ? Number(days) * 24 * 60 * 60 * 1000 : 0;
  durationMs += hours ? Number(hours) * 60 * 60 * 1000 : 0;
  durationMs += minutes ? Number(minutes) * 60 * 1000 : 0;

  return durationMs;
}

interface TimeInput {
  days: string | number;
  hours: string | number;
  minutes: string | number;
}

export function msToString(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  const durationString =
        displayUnit(days, "day") +
        displayUnit(hours, "hour") +
        displayUnit(minutes, "minute");

  return durationString;
}

function displayUnit(num: number, name: string, plural = "s") {
  if (!num || num === 0) return "";
  return `${num} ${name}${num > 1 ? plural : ""} `;
}
