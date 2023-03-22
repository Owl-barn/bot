import { localState } from "..";

export function calculateLevelFromXP(exp: number) {
  let currentLevel;

  for (let index = 0; index < localState.levelArray.length; index++) {
    if (localState.levelArray[index].total < exp) continue;
    currentLevel = index === 0 ? 0 : index - 1;
    break;
  }

  if (!currentLevel && currentLevel !== 0)
    throw "Couldn't calculate level.";

  const current = localState.levelArray[currentLevel];

  return {
    totalXP: exp,
    level: current.level,
    levelXP: current.xp,
    currentXP: exp - current.total,
  };
}
