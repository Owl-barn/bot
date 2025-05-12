export interface Module {
  name: string;
  description: string;
  version: string;
  isHidden?: boolean;
  initialize?: () => Promise<void>;

  path?: string;
}
