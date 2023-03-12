import { LevelArray } from "../structs/levelArray";
import { calculateXPForLevel } from "./calculateXPForLevel";

export function generateLevelArray(maxLevel: number) {
  const now = Date.now();
  const array: LevelArray[] = [];
  let total = 0;

  for (let i = 0; i < maxLevel + 1; i++) {
    const xp = calculateXPForLevel(i);
    // total is the xp from 0, xp is to the next level.
    array.push({ total, xp, level: i });
    total += xp;
  }

  console.log(
    " ✓ Loaded level array in ".green.bold +
    `${Date.now() - now}ms.`.cyan,
  );
  return array;
}
