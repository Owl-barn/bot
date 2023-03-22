import fs from "fs";
import { state } from "app";
import { Cron } from "@structs/cron";
import { CronJob } from "cron";


function validateJob(job: Cron, path: string) {
  if (typeof job.name !== "string")
    throw new Error(`Cronjob name must be a string. Path: ${path}`);

  if (typeof job.time !== "string")
    throw new Error(`Cronjob time must be a string. Path: ${path}`);

  if (typeof job.run !== "function")
    throw new Error(`Cronjob run function must be a function. Path: ${path}`);
}

export async function loadJobs(path: string) {
  const files = fs.readdirSync(path);
  let jobCount = 0;

  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const modulePath = `${path}/${file}`;
    const module = await import(modulePath);
    const job = module.default as Cron;

    validateJob(job, modulePath);

    new CronJob(
      job.time,
      job.run,
      null,
      true,
      "UTC",
    );

    jobCount++;

    if (state.env.isDevelopment) {
      console.log(` - Loaded cron job: ${job.name.green.italic}`.cyan.italic);
    }
  }

  console.log(" - Loaded ".green + String(jobCount).cyan + " cronjobs".green);
}
