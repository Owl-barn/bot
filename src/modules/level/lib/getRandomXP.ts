export function getRandomXP(modifier = 1.0) {
  return Math.floor(modifier * (Math.random() * (25 - 15) + 15));
}
