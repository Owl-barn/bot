import { state } from "@app";
import { HexColorString } from "discord.js";

export function getColour(size: number): HexColorString {
  let colour;
  switch (size) {
    case 0:
      colour = state.env.EMBED_COLOR;
      break;
    case 1:
      colour = state.env.EMBED_SUCCESS_COLOR;
      break;
    case 2:
      colour = state.env.EMBED_WARNING_COLOR;
      break;
    default:
      colour = state.env.EMBED_FAIL_COLOR;
      break;
  }

  return colour;
}
