import { Controller, Post, Body, UseGuards, Get, Param, Query } from '@nestjs/common';
import { SimulacaoService } from './simulacao.service';
import { SimularAcasalamentoDto, EncontrarMachosCompativeisDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('IA - Simulação')
@Controller('reproducao/simulacao')
export class SimulacaoController {
  constructor(private readonly simulacaoService: SimulacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Simula um acasalamento e prevê o potencial genético da prole' })
  @ApiResponse({ status: 200, description: 'Predição retornada com sucesso (atualmente com dados simulados).' })
  @ApiResponse({ status: 404, description: 'Macho ou fêmea não encontrado ou não pertence a este usuário.' })
  preverPotencial(@Body() simularAcasalamentoDto: SimularAcasalamentoDto, @User() user: any) {
    return this.simulacaoService.preverPotencial(simularAcasalamentoDto, user);
  }

  @Get('machos-compativeis/:id_femea')
  @ApiOperation({ summary: 'Encontra machos compatíveis para uma fêmea baseado na consanguinidade' })
  @ApiParam({
    name: 'id_femea',
    description: 'ID da búfala fêmea (UUID)',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    type: 'string',
  })
  @ApiQuery({
    name: 'maxConsanguinidade',
    description: 'Consanguinidade máxima aceitável em %',
    example: 6.25,
    required: false,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de machos compatíveis retornada com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id_bufalo: {
            type: 'string',
            description: 'ID do búfalo macho compatível (UUID)',
            example: 'a1b056f4-a2a8-4e4f-96c1-3d4cc0a7770d',
          },
          consanguinidade_macho: {
            type: 'number',
            description: 'Nível de consanguinidade em %',
            example: 3.25,
          },
        },
        required: ['id_bufalo', 'consanguinidade_macho'],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Fêmea não encontrada ou não pertence a este usuário.' })
  @ApiResponse({ status: 400, description: 'ID fornecido não é de uma fêmea.' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor ou serviço de IA indisponível.' })
  encontrarMachosCompativeis(@Param('id_femea') id_femea: string, @Query('maxConsanguinidade') maxConsanguinidade: string, @User() user: any) {
    return this.simulacaoService.encontrarMachosCompativeis(
      {
        idFemea: id_femea,
        maxConsanguinidade: maxConsanguinidade ? parseFloat(maxConsanguinidade) : 6.25,
      },
      user,
    );
  }
}
