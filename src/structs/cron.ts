export interface CronData {
  name: string;
  time: string;
}

export interface Cron extends CronData {
  run: () => Promise<void>;
}


export function cron(x: CronData, run: () => Promise<void>): Cron { return { ...x, run }; }
