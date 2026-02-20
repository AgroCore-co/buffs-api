import { Controller, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { PredicaoProducaoService } from './predicao-producao.service';
import { PredicaoProducaoInputDto, PredicaoProducaoResponseDto } from './dto';

/**
 * Controller responsável pelos endpoints de predição de produção via IA.
 *
 * **Endpoints:**
 * - POST /producao/predicao - Prediz produção individual de leite
 */
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('IA - Predição de Produção')
@Controller('producao/predicao')
@UseInterceptors(CacheInterceptor)
export class PredicaoProducaoController {
  constructor(private readonly predicaoProducaoService: PredicaoProducaoService) {}

  @Post()
  @CacheTTL(600) // 10 minutos
  @ApiOperation({
    summary: 'Predizer produção individual de leite (Cache: 10min)',
    description:
      'Prediz a produção de leite de uma fêmea para o próximo ciclo de lactação, ' +
      'classificando seu potencial produtivo e comparando com a média da propriedade.',
  })
  @ApiResponse({
    status: 200,
    description: 'Predição realizada com sucesso.',
    type: PredicaoProducaoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Fêmea não encontrada.' })
  @ApiResponse({ status: 503, description: 'Serviço de IA temporariamente indisponível.' })
  async predizerProducao(@Body() predicaoInput: PredicaoProducaoInputDto, @User() user: any): Promise<PredicaoProducaoResponseDto> {
    return this.predicaoProducaoService.predizerProducaoIndividual(predicaoInput.idFemea, user.sub);
  }
}
