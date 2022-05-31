// disable broken semi rule here
/*  eslint semi: ["off", "always"]*/
export default interface wsResponse {
    mid: string;
    data: {
        [key: string]: unknown;
        error?: string;
    };
}
