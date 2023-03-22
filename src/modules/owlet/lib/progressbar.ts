const defaultTheme = {
  start: "[",
  end: "]",
  passed: "=",
  remaining: "-",
  indicator: ">",
};

export function progressBar(
  percentage: number,
  size: number,
  theme: progressTheme = defaultTheme,
): string {
  let progress = theme.start;
  const playPosition = Math.ceil(percentage * size) - 1;

  for (let index = 0; index < size; index++) {
    if (index < playPosition || playPosition === size - 1)
      progress += theme.passed;
    else if (index === playPosition) progress += theme.indicator;
    else if (index > playPosition) progress += theme.remaining;
  }

  progress += theme.end;

  return progress;
}

interface progressTheme {
  start: string;
  end: string;
  passed: string;
  remaining: string;
  indicator: string;
}
