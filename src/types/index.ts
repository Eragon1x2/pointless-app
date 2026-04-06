export interface TargetPoint {
  lat: number;
  lng: number;
  distanceSet: number;
  address?: string;
}

export interface HistoryRecord {
  distanceSet: number;
  date: string;
  status: 'Win' | 'Lost';
  address?: string;
}
