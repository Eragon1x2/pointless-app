export interface TargetPoint {
  lat: number;
  lng: number;
  distanceSet: number;
  address?: string;
  createdAt: number;
}

export interface HistoryRecord {
  distanceSet: number;
  date: string;
  status: 'Win' | 'Lost';
  address?: string;
  timeTakenMs?: number;
  route?: [number, number][];
}
