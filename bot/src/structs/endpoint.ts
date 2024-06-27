export interface EndpointInfo {
  name: string;
  run: EndpointFunction;
}

export type EndpointFunction = (req: any, res: any) => void;

export interface EndpointActions {
  GET?: EndpointInfo;
  POST?: EndpointInfo;
  PUT?: EndpointInfo;
  DELETE?: EndpointInfo;
  PATCH?: EndpointInfo;
  OPTIONS?: EndpointInfo;
  HEAD?: EndpointInfo;
}

export function endpoint(actions: EndpointActions) {
  return actions;
}
