import * as loop from "./commands/loop";
import * as terminate from "./commands/terminate";
import * as pause from "./commands/pause";
import * as play from "./commands/play";
import * as queue from "./commands/queue";
import * as skip from "./commands/skip";
import * as stop from "./commands/stop";
import * as Status from "./commands/status";

export interface Commands {
  "Queue": { arguments: queue.Arguments, response: queue.Response },
  "Loop": { arguments: loop.Arguments, response: loop.Response },
  "Pause": { arguments: pause.Arguments, response: pause.Response },
  "Play": { arguments: play.Arguments, response: play.Response },
  "Skip": { arguments: skip.Arguments, response: skip.Response },
  "Status": { arguments: Status.Arguments, response: Status.Response },
  "Stop": { arguments: stop.Arguments, response: stop.Response },
  "Terminate": { arguments: terminate.Arguments, response: terminate.Response },
}