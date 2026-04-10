export interface SyncMeta {
  page: number;
  limit: number;
  total: number;
  updated_at: string;
  synced_at: string;
}

export interface SyncResponse<T> {
  data: T[];
  meta: SyncMeta;
}
