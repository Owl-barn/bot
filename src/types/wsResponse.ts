// disable broken semi rule here
/*  eslint semi: ["off", "always"]*/
export default interface wsResponse {
    [key: string]: unknown;
    error?: string;
}
