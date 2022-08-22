// eslint-disable-next-line no-shadow
const enum QueueEvent {
    SongEnd = "songEnd",
    SongStart = "songStart",
    QueueEnd = "queueEnd",
    SongError = "songError",
    Shutdown = "shutdown",
}

export default QueueEvent;
