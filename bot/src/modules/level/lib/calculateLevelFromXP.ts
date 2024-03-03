import { localState } from "..";

export interface CalculatedLevel {
  totalXP: number;
  level: number;
  levelXP: number;
  currentXP: number;
}


export function calculateLevelFromXP(exp: number): CalculatedLevel {
  let currentLevel;

  for (let index = 0; index < localState.levelArray.length; index++) {
    if (exp >= localState.levelArray[index].total) continue;
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
