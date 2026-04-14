export interface TargetPoint {
  lat: number;
  lng: number;
  distanceSet: number;
  address?: string;
  createdAt: number;
  unreachable?: boolean;
}

export interface HistoryRecord {
  distanceSet: number;
  date: string;
  status: 'Win' | 'Lost' | 'Tech Lost';
  address?: string;
  timeTakenMs?: number;
  route?: [number, number][];
}
