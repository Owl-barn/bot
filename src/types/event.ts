export default abstract class RavenEvent {
    name: string;
    once: boolean;

    abstract execute(...args: any[]): void;
}
