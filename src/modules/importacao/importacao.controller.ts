import { Controller, Post, UseInterceptors, UseGuards, UploadedFile, Param, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { LoggerService } from '../../core/logger/logger.service';
import { ImportacaoService } from './importacao.service';
import { ImportacaoPlanilhaParamDto, UploadPlanilhaResponseDto } from './dto';
import { UploadedFileInterface, AuthenticatedUser } from './interfaces';

/** MIME types aceitos no upload de planilhas */
const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
] as const;

/** Tamanho máximo do arquivo em bytes (10 MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Interface para requisição com parâmetros de rota (usado por Multer)
 */
interface RequestWithParams {
  params: {
    propriedadeId: string;
  };
}

/**
 * Interface para arquivo Multer (usado nos callbacks)
 */
interface MulterFile {
  originalname: string;
  mimetype: string;
}

/**
 * Controlador REST para importação de planilhas Excel.
 *
 * **Endpoints:**
 * - `POST /importacao/planilha/:propriedadeId` — Upload de planilha para processamento
 *
 * **Autenticação:**
 * Todos os endpoints exigem Bearer token JWT (Supabase).
 *
 * **Fluxo:**
 * 1. Valida arquivo (`.xlsx`/`.xls`, máx. 10 MB)
 * 2. Salva em `./temp/uploads/`
 * 3. Publica mensagem no RabbitMQ
 * 4. Worker Go processa assincronamente
 * 5. Retorna confirmação imediata ao cliente
 *
 * @class ImportacaoController
 * @see {@link ImportacaoService}
 */
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Importação')
@Controller('importacao')
export class ImportacaoController {
  constructor(
    private readonly importacaoService: ImportacaoService,
    private readonly logger: LoggerService,
  ) {}

  @Post('planilha/:propriedadeId')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      storage: diskStorage({
        destination: './temp/uploads',
        filename: (req: RequestWithParams, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
          const propriedadeId = req.params.propriedadeId;
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          const nomeOriginal = path.basename(file.originalname, ext);
          cb(null, `${propriedadeId}-${timestamp}-${nomeOriginal}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req: RequestWithParams, file: MulterFile, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (ALLOWED_MIMES.includes(file.mimetype as (typeof ALLOWED_MIMES)[number])) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Tipo de arquivo não suportado: ${file.mimetype}. Aceitos: .xlsx, .xls`), false);
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload de planilha Excel para processamento',
    description:
      'Faz upload de arquivo Excel que será processado assincronamente pelo worker. ' +
      'O processamento pode levar alguns minutos dependendo do volume de dados.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo Excel (.xlsx ou .xls) com dados de búfalos, pesagens, vacinas, etc.',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo Excel (.xlsx ou .xls, máximo 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Planilha recebida e enfileirada para processamento.',
    type: UploadPlanilhaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou erro no upload.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente ou inválido.' })
  @ApiResponse({ status: 422, description: 'propriedadeId não é um UUID válido.' })
  async uploadPlanilha(
    @Param() params: ImportacaoPlanilhaParamDto,
    @UploadedFile() file: UploadedFileInterface,
    @User() user: AuthenticatedUser,
  ): Promise<UploadPlanilhaResponseDto> {
    if (!file) {
      throw new BadRequestException('Campo "file" é obrigatório no formulário');
    }

    this.logger.logApiRequest('POST', `/importacao/planilha/${params.propriedadeId}`, undefined, {
      module: 'ImportacaoController',
      method: 'uploadPlanilha',
      userEmail: user?.email ?? user?.sub,
    });

    return this.importacaoService.processarPlanilha(file, params.propriedadeId, user.id);
  }
}
