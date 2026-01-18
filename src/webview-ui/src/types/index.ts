export interface ResponseData {
  title: string;
  request?: any;
  response?: any;
  events?: Array<{ index: number; data: any }>;
  eventCount?: number;
  isError: boolean;
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
