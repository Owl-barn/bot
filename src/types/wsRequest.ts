// disable broken semi rule here
/*  eslint semi: ["off", "always"]*/
export default interface wsRequest {
  mid: string;
  command: string;
  data: Record<string, unknown>;
}
