import * as loop from "./loop";
import * as pause from "./pause";
import * as play from "./play";
import * as queue from "./queue";
import * as skip from "./skip";
import * as stop from "./stop";
import * as terminate from "./terminate";
import * as Status from "./status";

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
