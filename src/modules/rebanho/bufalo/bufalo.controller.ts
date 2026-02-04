import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  UseInterceptors,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { BufaloService } from './bufalo.service';
import { CreateBufaloDto, UpdateBufaloDto, UpdateGrupoBufaloDto, FiltroAvancadoBufaloDto, CategoriaABCB, InativarBufaloDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { LoggerService } from '../../../core/logger/logger.service';

/**
 * Controlador REST para gerenciamento de búfalos.
 *
 * **Endpoints Principais:**
 * - POST /bufalos - Cadastrar novo búfalo
 * - GET /bufalos - Listar todos os búfalos (paginado)
 * - GET /bufalos/:id - Buscar búfalo por ID
 * - PATCH /bufalos/:id - Atualizar búfalo
 * - DELETE /bufalos/:id - Inativar búfalo (soft-delete)
 * - GET /bufalos/categoria/:categoria - Filtrar por categoria ABCB
 * - GET /bufalos/filtros - Filtros avançados (sexo, maturidade, status, etc.)
 *
 * **Autenticação:**
 * Todos os endpoints exigem autenticação JWT via Bearer token.
 * Usuários só podem acessar búfalos de propriedades vinculadas.
 *
 * **Cache:**
 * - Removido da maioria dos endpoints devido a mudanças frequentes
 * - Mantido apenas em consultas de categoria (TTL: 10 minutos)
 *
 * **Observações:**
 * - Maturidade é atualizada automaticamente em queries
 * - Categoria ABCB é calculada na criação/atualização
 * - Soft-delete: búfalos inativos permanecem no banco
 *
 * @class BufaloController
 * @see {@link BufaloService}
 */
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Búfalos')
@Controller('bufalos')
export class BufaloController {
  constructor(
    private readonly bufaloService: BufaloService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registra um novo búfalo para o usuário logado' })
  @ApiResponse({ status: 201, description: 'Búfalo registrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 404, description: 'Propriedade, raça ou outra referência não encontrada.' })
  create(@Body() createBufaloDto: CreateBufaloDto, @User() user: any) {
    this.logger.logApiRequest('POST', '/bufalos', undefined, {
      module: 'BufaloController',
      method: 'create',
      userEmail: user?.email || user?.sub,
    });

    return this.bufaloService.create(createBufaloDto, user);
  }

  @Get()
  // Cache removido: dados de búfalos mudam frequentemente (criação, atualização, mudanças automáticas de maturidade)
  @ApiOperation({
    summary: 'Lista todos os búfalos do usuário logado com paginação',
    description: 'Retorna búfalos ordenados por data de nascimento (mais antigos primeiro), priorizando animais com status = true',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (começa em 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de itens por página (máximo 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos retornada com sucesso.' })
  findAll(@User() user: any, @Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', '/bufalos', undefined, {
      module: 'BufaloController',
      method: 'findAll',
      userEmail: user?.email || user?.sub,
    });
    return this.bufaloService.findAll(user, paginationDto);
  }

  @Get('categoria/:categoria')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutos - categorias mudam menos
  @ApiOperation({ summary: 'Lista búfalos por categoria ABCB' })
  @ApiParam({ name: 'categoria', description: 'Categoria ABCB', enum: CategoriaABCB })
  @ApiResponse({ status: 200, description: 'Búfalos da categoria retornados com sucesso.' })
  findByCategoria(@Param('categoria') categoria: CategoriaABCB, @User() user: any) {
    return this.bufaloService.findByCategoria(categoria, user);
  }

  @Get('propriedade/:id_propriedade')
  // Cache removido: maturidade dos búfalos muda dinamicamente baseado em idade
  @ApiOperation({
    summary: 'Lista todos os búfalos de uma propriedade específica com paginação',
    description: 'Retorna búfalos de uma propriedade ordenados por status (ativos primeiro) e data de nascimento (mais antigos primeiro)',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (começa em 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de itens por página (máximo 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou você não tem acesso a ela.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() paginationDto: PaginationDto) {
    return this.bufaloService.findByPropriedade(id_propriedade, user, paginationDto);
  }

  @Get('microchip/:microchip')
  // Cache removido: maturidade dos búfalos muda dinamicamente baseado em idade
  @ApiOperation({ summary: 'Busca um búfalo pelo microchip' })
  @ApiParam({ name: 'microchip', description: 'Número do microchip do búfalo', type: String })
  @ApiResponse({ status: 200, description: 'Búfalo encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo com o microchip especificado não encontrado.' })
  findByMicrochip(@Param('microchip') microchip: string, @User() user: any) {
    return this.bufaloService.findByMicrochip(microchip, user);
  }

  @Get('grupo/:id_grupo')
  @ApiOperation({
    summary: 'Lista todos os búfalos de um grupo de manejo específico com paginação',
    description:
      'Retorna búfalos ativos associados ao grupo ordenados por data de nascimento (mais antigos primeiro). Facilita a exibição de búfalos por grupo na interface sem necessidade de filtros manuais.',
  })
  @ApiParam({ name: 'id_grupo', description: 'ID do grupo de manejo (UUID)', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (começa em 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de itens por página (máximo 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos do grupo retornada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado ou você não tem acesso a ele.' })
  findByGrupo(@Param('id_grupo', ParseUUIDPipe) id_grupo: string, @User() user: any, @Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', `/bufalos/grupo/${id_grupo}`, undefined, {
      module: 'BufaloController',
      method: 'findByGrupo',
      userEmail: user?.email || user?.sub,
    });
    return this.bufaloService.findByGrupo(id_grupo, user, paginationDto);
  }

  // ========== ROTAS DE FILTRAGEM ==========

  @Get('filtro/raca/:id_raca/propriedade/:id_propriedade')
  // Cache removido: maturidade dos búfalos muda dinamicamente baseado em idade
  @ApiOperation({
    summary: 'Filtra búfalos por raça em uma propriedade',
    description: 'Retorna búfalos de uma raça específica ordenados por status (ativos primeiro) e data de nascimento (mais antigos primeiro).',
  })
  @ApiParam({ name: 'id_raca', description: 'ID da raça (UUID)', type: String })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (começa em 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de itens por página (máximo 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou sem acesso.' })
  findByRaca(
    @Param('id_raca', ParseUUIDPipe) id_raca: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bufaloService.findByRaca(id_raca, id_propriedade, user, paginationDto);
  }

  @Get('filtro/raca/:id_raca/propriedade/:id_propriedade/brinco/:brinco')
  // Cache removido: maturidade dos búfalos muda dinamicamente baseado em idade
  @ApiOperation({
    summary: 'Filtra búfalos por raça e brinco (busca progressiva)',
    description:
      'Permite busca progressiva do brinco. Exemplos: "IZ" encontra "IZ-001", "IZ-002"; "IZ-0" encontra "IZ-001", "IZ-099"; "IZ-001" encontra apenas "IZ-001". Útil quando a propriedade usa múltiplos padrões como "IZ-000" e "BUF-000".',
  })
  @ApiParam({ name: 'id_raca', description: 'ID da raça (UUID)', type: String })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiParam({
    name: 'brinco',
    description: 'Início do código do brinco (ex: "IZ", "IZ-0", "IZ-001")',
    type: String,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou sem acesso.' })
  findByRacaAndBrinco(
    @Param('id_raca', ParseUUIDPipe) id_raca: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Param('brinco') brinco: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bufaloService.findByRacaAndBrinco(id_raca, id_propriedade, brinco, user, paginationDto);
  }

  @Get('filtro/propriedade/:id_propriedade/avancado')
  // Cache removido: maturidade dos búfalos muda dinamicamente baseado em idade
  @ApiOperation({
    summary: 'Filtragem avançada por múltiplos critérios',
    description:
      'Permite combinar filtros: raça, sexo (M/F), maturidade (B/N/V/T), status (true/false) e brinco (busca progressiva). Todos os filtros são opcionais.',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiQuery({ name: 'id_raca', required: false, type: String, description: 'ID da raça (UUID)' })
  @ApiQuery({ name: 'sexo', required: false, enum: ['M', 'F'], description: 'M-Macho, F-Fêmea' })
  @ApiQuery({
    name: 'nivel_maturidade',
    required: false,
    enum: ['B', 'N', 'V', 'T'],
    description: 'B-Bezerro, N-Novilho/Novilha, V-Vaca, T-Touro',
  })
  @ApiQuery({ name: 'status', required: false, type: Boolean, description: 'true-Ativo, false-Inativo' })
  @ApiQuery({
    name: 'brinco',
    required: false,
    type: String,
    description: 'Início do brinco (ex: "IZ", "BUF")',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou sem acesso.' })
  findByFiltros(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() queryParams: FiltroAvancadoBufaloDto, @User() user: any) {
    const { page, limit, ...filtros } = queryParams;
    const paginationDto = { page, limit };
    return this.bufaloService.findByFiltros(id_propriedade, filtros, user, paginationDto);
  }

  // ========== FILTROS POR SEXO ==========

  @Get('filtro/sexo/:sexo/propriedade/:id_propriedade')
  @ApiOperation({
    summary: 'Filtra búfalos por sexo em uma propriedade',
    description: 'Retorna búfalos de um sexo específico ordenados por status (ativos primeiro) e data de nascimento.',
  })
  @ApiParam({ name: 'sexo', description: 'Sexo do búfalo (M ou F)', enum: ['M', 'F'] })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findBySexo(
    @Param('sexo') sexo: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bufaloService.findBySexo(sexo, id_propriedade, user, paginationDto);
  }

  @Get('filtro/sexo/:sexo/propriedade/:id_propriedade/brinco/:brinco')
  @ApiOperation({
    summary: 'Filtra búfalos por sexo e brinco (busca progressiva)',
    description: 'Retorna búfalos de um sexo específico cujo brinco comece com o valor informado.',
  })
  @ApiParam({ name: 'sexo', description: 'Sexo do búfalo (M ou F)', enum: ['M', 'F'] })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiParam({ name: 'brinco', description: 'Início do código do brinco', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findBySexoAndBrinco(
    @Param('sexo') sexo: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Param('brinco') brinco: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bufaloService.findBySexoAndBrinco(sexo, id_propriedade, brinco, user, paginationDto);
  }

  @Get('filtro/sexo/:sexo/propriedade/:id_propriedade/status/:status')
  @ApiOperation({
    summary: 'Filtra búfalos por sexo e status',
    description: 'Retorna búfalos de um sexo específico com determinado status.',
  })
  @ApiParam({ name: 'sexo', description: 'Sexo do búfalo (M ou F)', enum: ['M', 'F'] })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiParam({ name: 'status', description: 'Status do búfalo (true ou false)', enum: ['true', 'false'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findBySexoAndStatus(
    @Param('sexo') sexo: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Param('status') status: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    const statusBoolean = status === 'true';
    return this.bufaloService.findBySexoAndStatus(sexo, statusBoolean, id_propriedade, user, paginationDto);
  }

  // ========== FILTROS POR MATURIDADE ==========

  @Get('filtro/maturidade/:nivel_maturidade/propriedade/:id_propriedade')
  @ApiOperation({
    summary: 'Filtra búfalos por maturidade em uma propriedade',
    description: 'Retorna búfalos de um nível de maturidade específico (B, N, V, T).',
  })
  @ApiParam({
    name: 'nivel_maturidade',
    description: 'Nível de maturidade',
    enum: ['B', 'N', 'V', 'T'],
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findByMaturidade(
    @Param('nivel_maturidade') nivel_maturidade: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bufaloService.findByMaturidade(nivel_maturidade, id_propriedade, user, paginationDto);
  }

  @Get('filtro/maturidade/:nivel_maturidade/propriedade/:id_propriedade/brinco/:brinco')
  @ApiOperation({
    summary: 'Filtra búfalos por maturidade e brinco (busca progressiva)',
    description: 'Retorna búfalos de um nível de maturidade específico cujo brinco comece com o valor informado.',
  })
  @ApiParam({
    name: 'nivel_maturidade',
    description: 'Nível de maturidade',
    enum: ['B', 'N', 'V', 'T'],
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiParam({ name: 'brinco', description: 'Início do código do brinco', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findByMaturidadeAndBrinco(
    @Param('nivel_maturidade') nivel_maturidade: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Param('brinco') brinco: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bufaloService.findByMaturidadeAndBrinco(nivel_maturidade, id_propriedade, brinco, user, paginationDto);
  }

  @Get('filtro/maturidade/:nivel_maturidade/propriedade/:id_propriedade/status/:status')
  @ApiOperation({
    summary: 'Filtra búfalos por maturidade e status',
    description: 'Retorna búfalos de um nível de maturidade específico com determinado status.',
  })
  @ApiParam({
    name: 'nivel_maturidade',
    description: 'Nível de maturidade',
    enum: ['B', 'N', 'V', 'T'],
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiParam({ name: 'status', description: 'Status do búfalo (true ou false)', enum: ['true', 'false'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findByMaturidadeAndStatus(
    @Param('nivel_maturidade') nivel_maturidade: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Param('status') status: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    const statusBoolean = status === 'true';
    return this.bufaloService.findByMaturidadeAndStatus(nivel_maturidade, statusBoolean, id_propriedade, user, paginationDto);
  }

  // ========== FILTROS POR RAÇA + STATUS ==========

  @Get('filtro/raca/:id_raca/propriedade/:id_propriedade/status/:status')
  @ApiOperation({
    summary: 'Filtra búfalos por raça e status',
    description: 'Retorna búfalos de uma raça específica com determinado status.',
  })
  @ApiParam({ name: 'id_raca', description: 'ID da raça (UUID)', type: String })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiParam({ name: 'status', description: 'Status do búfalo (true ou false)', enum: ['true', 'false'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findByRacaAndStatus(
    @Param('id_raca', ParseUUIDPipe) id_raca: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Param('status') status: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    const statusBoolean = status === 'true';
    return this.bufaloService.findByRacaAndStatus(id_raca, statusBoolean, id_propriedade, user, paginationDto);
  }

  // ========== FILTROS POR STATUS ==========

  @Get('filtro/status/:status/propriedade/:id_propriedade')
  @ApiOperation({
    summary: 'Filtra búfalos por status',
    description: 'Retorna búfalos com determinado status. Ordenação apenas por data de nascimento (mais antigos primeiro).',
  })
  @ApiParam({ name: 'status', description: 'Status do búfalo (true ou false)', enum: ['true', 'false'] })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findByStatus(
    @Param('status') status: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    const statusBoolean = status === 'true';
    return this.bufaloService.findByStatus(statusBoolean, id_propriedade, user, paginationDto);
  }

  @Get('filtro/status/:status/propriedade/:id_propriedade/brinco/:brinco')
  @ApiOperation({
    summary: 'Filtra búfalos por status e brinco (busca progressiva)',
    description: 'Retorna búfalos com determinado status cujo brinco comece com o valor informado. Ordenação apenas por data de nascimento.',
  })
  @ApiParam({ name: 'status', description: 'Status do búfalo (true ou false)', enum: ['true', 'false'] })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiParam({ name: 'brinco', description: 'Início do código do brinco', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de búfalos filtrados.' })
  findByStatusAndBrinco(
    @Param('status') status: string,
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Param('brinco') brinco: string,
    @User() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    const statusBoolean = status === 'true';
    return this.bufaloService.findByStatusAndBrinco(statusBoolean, id_propriedade, brinco, user, paginationDto);
  }

  @Get(':id')
  // Cache removido: maturidade dos búfalos muda dinamicamente baseado em idade
  @ApiOperation({ summary: 'Busca um búfalo específico pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do búfalo', type: String })
  @ApiResponse({ status: 200, description: 'Dados do búfalo.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.bufaloService.findOne(id, user);
  }

  @Patch('grupo/mover')
  @ApiOperation({
    summary: 'Muda o grupo de manejo de um ou mais búfalos',
    description: `
      Move búfalos de um grupo para outro, útil para mudanças de status como:
      - Lactando → Secagem
      - Novilhas → Reprodução
      - Tratamento → Rebanho geral
      
      Esta operação não move fisicamente os animais de lote/piquete.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Grupo dos búfalos atualizado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        grupo_destino: { type: 'string' },
        total_processados: { type: 'number' },
        motivo: { type: 'string', nullable: true },
        animais: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id_bufalo: { type: 'number' },
              nome: { type: 'string' },
              grupo_anterior: { type: 'string' },
              grupo_novo: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou búfalos duplicados.' })
  @ApiResponse({ status: 404, description: 'Um dos búfalos ou o grupo de destino não foi encontrado.' })
  async updateGrupo(@Body() updateGrupoDto: UpdateGrupoBufaloDto, @User() user: any) {
    const startTime = Date.now();
    const userInfo = user?.sub || user?.id || 'unknown';

    this.logger.log(`[REQUEST] Mudanca de grupo solicitada - Usuario: ${userInfo}, Payload: ${JSON.stringify(updateGrupoDto)}`);

    try {
      const result = await this.bufaloService.updateGrupo(updateGrupoDto, user);
      const duration = Date.now() - startTime;

      this.logger.log(
        `[RESPONSE_SUCCESS] Mudanca de grupo concluida - Usuario: ${userInfo}, Processados: ${result.total_processados}, Duracao: ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[RESPONSE_ERROR] Falha na mudanca de grupo - Usuario: ${userInfo}, Erro: ${error.message}, Duracao: ${duration}ms`);
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um búfalo' })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser atualizado', type: String })
  @ApiResponse({ status: 200, description: 'Búfalo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateBufaloDto: UpdateBufaloDto, @User() user: any) {
    console.log('🔄 Controller PATCH /bufalos/:id chamado');
    console.log('📝 DTO recebido:', updateBufaloDto);
    console.log('👤 User:', user?.email || user?.sub);

    return this.bufaloService.update(id, updateBufaloDto, user);
  }

  // ==================== INATIVAÇÃO E REATIVAÇÃO ====================

  @Post(':id/inativar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inativa um búfalo com data e motivo',
    description: `
      Marca um búfalo como inativo, registrando formalmente a data de baixa e o motivo da inativação.
      
      **Diferenças entre inativar e soft delete:**
      - **Inativar**: Registra \`data_baixa\` e \`motivo_inativo\` para rastreabilidade formal e auditoria
      - **Soft Delete**: Apenas marca \`deleted_at\` para remoção lógica temporária
      
      **Validações aplicadas:**
      - Búfalo deve existir e estar ativo
      - Data de baixa não pode ser anterior à data de nascimento
      - Data de baixa não pode estar no futuro
      - Usuário deve ter acesso ao búfalo através das propriedades vinculadas
      
      **Motivos comuns de inativação:**
      - Venda para outra propriedade
      - Morte natural ou por doença
      - Descarte por baixa produtividade
      - Abate para consumo
      - Transferência definitiva
      
      **Rastreabilidade:**
      Este endpoint garante registro permanente do motivo e data da baixa,
      permitindo auditorias futuras e análises estatísticas de causas de baixa no rebanho.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do búfalo a ser inativado (UUID)',
    type: 'string',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
  })
  @ApiResponse({
    status: 200,
    description: 'Búfalo inativado com sucesso.',
    schema: {
      example: {
        message: 'Búfalo inativado com sucesso.',
        data: {
          id_bufalo: 'b8c4a72d-1234-4567-8901-234567890123',
          nome: 'Valente',
          brinco: 'BR54321',
          status: false,
          data_baixa: '20/01/2024',
          motivo_inativo: 'Venda para outra propriedade',
          dt_nascimento: '20/05/2023',
          sexo: 'F',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Búfalo já está inativo ou dados inválidos (ex: data de baixa anterior ao nascimento).',
    schema: {
      example: {
        statusCode: 400,
        message: 'Este búfalo já está inativo. Use o endpoint de reativação se deseja reativá-lo.',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado. Token JWT inválido ou ausente.' })
  @ApiResponse({
    status: 404,
    description: 'Búfalo não encontrado ou usuário não tem acesso.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Búfalo com ID b8c4a72d-1234-4567-8901-234567890123 não encontrado nas propriedades vinculadas ao usuário.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  async inativar(@Param('id', ParseUUIDPipe) id: string, @Body() inativarDto: InativarBufaloDto, @User() user: any) {
    this.logger.logApiRequest('POST', `/bufalos/${id}/inativar`, user?.email, {
      module: 'BufaloController',
      method: 'inativar',
      bufaloId: id,
      motivo: inativarDto.motivoInativo,
    });

    return this.bufaloService.inativar(id, inativarDto, user);
  }

  @Post(':id/reativar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reativa um búfalo inativado',
    description: `
      Remove a marcação de inativo de um búfalo, limpando a data de baixa e o motivo de inativação.
      
      **Propósito:**
      Permite reverter uma inativação, útil em casos de:
      - Erro no registro de inativação
      - Animal devolvido após venda cancelada
      - Retorno de animal emprestado ou transferido temporariamente
      - Correção de dados administrativos
      
      **Ações executadas:**
      - Define \`status\` como \`true\`
      - Remove \`data_baixa\` (define como \`null\`)
      - Remove \`motivo_inativo\` (define como \`null\`)
      - Atualiza timestamp de \`updated_at\`
      
      **Validações aplicadas:**
      - Búfalo deve existir e estar inativo
      - Usuário deve ter acesso ao búfalo através das propriedades vinculadas
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do búfalo a ser reativado (UUID)',
    type: 'string',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
  })
  @ApiResponse({
    status: 200,
    description: 'Búfalo reativado com sucesso.',
    schema: {
      example: {
        message: 'Búfalo reativado com sucesso.',
        data: {
          id_bufalo: 'b8c4a72d-1234-4567-8901-234567890123',
          nome: 'Valente',
          brinco: 'BR54321',
          status: true,
          data_baixa: null,
          motivo_inativo: null,
          dt_nascimento: '20/05/2023',
          sexo: 'F',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Búfalo já está ativo.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Este búfalo já está ativo.',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado. Token JWT inválido ou ausente.' })
  @ApiResponse({
    status: 404,
    description: 'Búfalo não encontrado ou usuário não tem acesso.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Búfalo com ID b8c4a72d-1234-4567-8901-234567890123 não encontrado nas propriedades vinculadas ao usuário.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  async reativar(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('POST', `/bufalos/${id}/reativar`, user?.email, {
      module: 'BufaloController',
      method: 'reativar',
      bufaloId: id,
    });

    return this.bufaloService.reativar(id, user);
  }

  // ==================== REMOÇÃO LÓGICA ====================

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove um búfalo do rebanho (soft delete)',
    description: 'Marca o búfalo como removido sem deletar do banco. Use POST /:id/restore para recuperar.',
  })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser removido', type: String })
  @ApiResponse({ status: 204, description: 'Búfalo removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    console.log('Controller DELETE /bufalos/:id chamado');
    console.log('User:', user?.email || user?.sub);

    return this.bufaloService.remove(id, user);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaura búfalo removido',
    description: 'Restaura um búfalo que foi removido com soft delete.',
  })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser restaurado', type: String })
  @ApiResponse({ status: 200, description: 'Búfalo restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não estava removido.' })
  async restore(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('POST', `/bufalos/${id}/restore`, undefined, {
      module: 'BufaloController',
      method: 'restore',
      userEmail: user?.email || user?.sub,
    });

    return this.bufaloService.restore(id, user);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Lista búfalos removidos',
    description: 'Lista todos os búfalos incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista de búfalos incluindo deletados retornada com sucesso.' })
  async findAllWithDeleted(@User() user: any) {
    this.logger.logApiRequest('GET', '/bufalos/deleted/all', undefined, {
      module: 'BufaloController',
      method: 'findAllWithDeleted',
      userEmail: user?.email || user?.sub,
    });

    return this.bufaloService.findAllWithDeleted(user);
  }

  @Post('processar-categoria/:id')
  @ApiOperation({ summary: 'Força o processamento da categoria ABCB de um búfalo' })
  @ApiParam({ name: 'id', description: 'ID do búfalo' })
  @ApiResponse({ status: 200, description: 'Categoria processada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no processamento.' })
  async processarCategoria(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    try {
      console.log(`Iniciando processamento da categoria para búfalo ID: ${id}`);

      // Primeiro verifica se o usuário tem acesso ao búfalo
      const bufaloAntes = await this.bufaloService.findOne(id, user);
      console.log(`Categoria antes do processamento: ${bufaloAntes.categoria}`);

      // Processa a categoria
      const resultado = await this.bufaloService.processarCategoriaABCB(id);

      // Busca o búfalo atualizado para retornar a categoria
      const bufaloAtualizado = await this.bufaloService.findOne(id, user);
      console.log(`Categoria após processamento: ${bufaloAtualizado.categoria}`);

      return {
        message: 'Categoria processada com sucesso',
        bufalo: {
          id: bufaloAtualizado.id_bufalo,
          nome: bufaloAtualizado.nome,
          categoriaAntes: bufaloAntes.categoria,
          categoriaDepois: bufaloAtualizado.categoria,
        },
        processamento: {
          sucesso: resultado !== null,
          categoriaCalculada: resultado,
        },
      };
    } catch (error) {
      console.error(`Erro no processamento da categoria para búfalo ${id}:`, error);

      // Re-throw erros conhecidos
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }

      // Para erros não tratados
      throw new InternalServerErrorException(`Erro inesperado no processamento da categoria: ${error.message}`);
    }
  }

  @Post('processar-categoria/propriedade/:id_propriedade')
  @ApiOperation({
    summary: 'Processa a categoria ABCB de todos os búfalos de uma propriedade',
    description: `
      Processa a categoria ABCB de todos os búfalos da propriedade de forma automática.
      Este processo pode demorar alguns minutos dependendo da quantidade de animais.
      
      Retorna um relatório detalhado com:
      - Total de búfalos processados
      - Número de sucessos e erros
      - Detalhes de cada animal (categoria antes/depois)
    `,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: String })
  @ApiResponse({
    status: 200,
    description: 'Processamento concluído com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Processamento de categorias concluído' },
        total: { type: 'number', example: 150 },
        processados: { type: 'number', example: 150 },
        sucesso: { type: 'number', example: 145 },
        erros: { type: 'number', example: 5 },
        detalhes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id_bufalo: { type: 'string' },
              nome: { type: 'string' },
              categoriaAntes: { type: 'string', nullable: true },
              categoriaDepois: { type: 'string', nullable: true },
              status: { type: 'string', enum: ['sucesso', 'erro'] },
              mensagem: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou sem acesso.' })
  @ApiResponse({ status: 500, description: 'Erro interno no processamento.' })
  async processarCategoriaPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any) {
    const startTime = Date.now();
    const userInfo = user?.sub || user?.id || 'unknown';

    this.logger.log(`[REQUEST] Processamento de categorias em lote - Usuario: ${userInfo}, Propriedade: ${id_propriedade}`);

    try {
      const resultado = await this.bufaloService.processarCategoriaPropriedade(id_propriedade, user);
      const duration = Date.now() - startTime;

      this.logger.log(
        `[RESPONSE_SUCCESS] Processamento concluído - Usuario: ${userInfo}, Total: ${resultado.total}, Sucesso: ${resultado.sucesso}, Erros: ${resultado.erros}, Duracao: ${duration}ms`,
      );

      return resultado;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[RESPONSE_ERROR] Falha no processamento em lote - Usuario: ${userInfo}, Propriedade: ${id_propriedade}, Erro: ${error.message}, Duracao: ${duration}ms`,
      );
      throw error;
    }
  }
}
