export interface Module {
  name: string;
  description: string;
  version: string;
  isHidden?: boolean;
  initialize?: () => Promise<void>;
  stats?: (guildId?: string) => Promise<{ name: string; value: string, inline: boolean }>;

  path?: string;
}

