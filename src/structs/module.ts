export interface Module {
  name: string;
  description: string;
  version: string;
  initialize?: () => Promise<void>;

  path?: string;
}
