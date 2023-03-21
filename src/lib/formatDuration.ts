import moment from "moment";

export const formatDuration = (ms: number) =>
  moment()
    .startOf("day")
    .milliseconds(ms)
    .format("H:mm:ss");

