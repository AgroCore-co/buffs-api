import { ApiProperty } from '@nestjs/swagger';

export class EtlRowErrorDto {
  @ApiProperty({ description: 'Número da linha com erro.', example: 5 })
  row: number;

  @ApiProperty({ description: 'Campo que contém o erro.', example: 'brinco' })
  field: string;

  @ApiProperty({ description: 'Valor inválido encontrado.', example: 'ABC' })
  value: string;

  @ApiProperty({ description: 'Mensagem descritiva do erro.', example: 'Brinco não encontrado no rebanho' })
  message: string;
}

export class EtlRowWarningDto {
  @ApiProperty({ description: 'Número da linha com aviso.', example: 3 })
  row: number;

  @ApiProperty({ description: 'Campo relacionado ao aviso.', example: 'quantidade' })
  field: string;

  @ApiProperty({ description: 'Valor que gerou o aviso.', example: '0.5' })
  value: string;

  @ApiProperty({ description: 'Mensagem descritiva do aviso.', example: 'Valor abaixo da média esperada' })
  message: string;
}

export class ImportResponseDto {
  @ApiProperty({ description: 'ID do job (se processamento assíncrono).', required: false })
  jobId?: string;

  @ApiProperty({ description: 'Total de linhas processadas.', example: 100 })
  totalRows: number;

  @ApiProperty({ description: 'Total de linhas importadas com sucesso.', example: 95 })
  imported: number;

  @ApiProperty({ description: 'Total de linhas ignoradas.', example: 3 })
  skipped: number;

  @ApiProperty({ description: 'Lista de erros encontrados.', type: [EtlRowErrorDto] })
  errors: EtlRowErrorDto[];

  @ApiProperty({ description: 'Lista de avisos encontrados.', type: [EtlRowWarningDto] })
  warnings: EtlRowWarningDto[];
}

export class JobStatusResponseDto {
  @ApiProperty({ description: 'ID do job.', example: 'job-abc-123' })
  jobId: string;

  @ApiProperty({
    description: 'Status atual do job.',
    enum: ['pending', 'processing', 'done', 'failed'],
    example: 'processing',
  })
  status: 'pending' | 'processing' | 'done' | 'failed';

  @ApiProperty({ description: 'Progresso (0.0 a 1.0).', example: 0.75 })
  progress: number;

  @ApiProperty({ description: 'Resultado final (quando status = done).', required: false, type: ImportResponseDto })
  result?: ImportResponseDto;

  @ApiProperty({ description: 'Data de criação do job.' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do job.' })
  updatedAt: Date;
}
