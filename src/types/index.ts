export type Metric = {
  value: string | number;
  label?: string;
};

export type EntryRecord = {
  id: string;
  visitorName: string;
  zoneName: string;
  severity: string;
  entryTime: string;
  exitTime: string | null;
  dwellTime: string;
};

export type AlertRecord = {
  id: string;
  action: string;
  zone: string;
  site: string;
  severity: string;
  time: string;
};
