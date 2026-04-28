import { ExportFiltersDto } from '../dto/export-filters.dto';

/**
 * Interface local para arquivo Multer.
 * Replica os campos necessários de Express.Multer.File sem depender de @types/multer.
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface EtlRowError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface EtlRowWarning {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface EtlImportResult {
  jobId?: string;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: EtlRowError[];
  warnings: EtlRowWarning[];
}

export interface EtlImportResultRaw {
  jobId?: string;
  job_id?: string;
  totalRows?: number;
  total_rows?: number;
  imported?: number;
  skipped?: number;
  errors?: EtlRowError[];
  warnings?: EtlRowWarning[];
}

export interface EtlJobStatus {
  jobId?: string;
  job_id?: string;
  status: string;
  progress?: number;
  result?: EtlImportResult | EtlImportResultRaw;
  createdAt?: string | Date;
  created_at?: string | Date;
  updatedAt?: string | Date;
  updated_at?: string | Date;
  error?: string;
}

export interface IEtlClient {
  importLeite(propertyId: string, userId: string, file: MulterFile): Promise<EtlImportResult>;
  importPesagem(propertyId: string, userId: string, file: MulterFile): Promise<EtlImportResult>;
  importReproducao(propertyId: string, userId: string, file: MulterFile): Promise<EtlImportResult>;

  exportLeite(filters: ExportFiltersDto): Promise<Buffer>;
  exportPesagem(filters: ExportFiltersDto): Promise<Buffer>;
  exportReproducao(filters: ExportFiltersDto): Promise<Buffer>;

  getJobStatus(jobId: string, userId: string): Promise<EtlJobStatus>;
}

export const ETL_CLIENT = 'ETL_CLIENT';
