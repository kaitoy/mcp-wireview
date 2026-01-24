export interface HTTPHeaders {
  [key: string]: string;
}

export interface HTTPInfo {
  requestHeaders: HTTPHeaders;
  responseHeaders: HTTPHeaders;
}

export interface ResponseData {
  title: string;
  request?: any;
  response?: any;
  events?: Array<{ index: number; data: any }>;
  eventCount?: number;
  isError: boolean;
  httpInfo?: HTTPInfo;
}

export interface ResponseSectionProps {
  title: string;
  children: React.ReactNode;
  isError?: boolean;
}

export interface EventItemProps {
  index: number;
  data: any;
}
