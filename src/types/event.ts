import { PlayerEvents } from "discord-player";

export default abstract class Event {
    name: keyof PlayerEvents;
    once: boolean;

    abstract execute(...args: any[]): void;
}
