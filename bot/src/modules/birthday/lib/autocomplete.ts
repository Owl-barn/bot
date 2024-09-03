import { AutocompleteInteraction } from "discord.js";

export async function TimezoneAutocomplete(msg: AutocompleteInteraction, value: string) {
  const timeZones = Intl.supportedValuesOf("timeZone");

  return timeZones
    .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 24)
    .map((name) => ({
      name,
      value: name,
    }));
}
