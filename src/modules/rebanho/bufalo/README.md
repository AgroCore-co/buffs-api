# Módulo Rebanho - Búfalos

## 📋 Visão Geral

Módulo responsável pelo gerenciamento completo de búfalos, incluindo cadastro, consultas, atualizações, filtros avançados e cálculos automáticos de maturidade e categoria ABCB.

## 🎯 Funcionalidades Principais

### 1. **CRUD Completo**
- ✅ Cadastro de búfalos com validações robustas
- ✅ Consulta com paginação e filtros avançados
- ✅ Atualização de dados individuais ou em lote
- ✅ Soft-delete (inativação ao invés de exclusão física)
- ✅ Histórico de movimentações entre grupos

### 2. **Cálculos Automáticos**

#### **Maturidade** (BufaloMaturidadeService)
Calcula automaticamente baseado em data de nascimento e sexo:
- **Bezerro (B)**: 0-12 meses
- **Novilho/Novilha (N)**: 12-24 meses  
- **Vaca (V)**: Fêmeas após primeira cria (~36 meses)
- **Touro (T)**: Machos reprodutores (>24 meses)

#### **Categoria ABCB** (BufaloCategoriaService)
Calcula baseado em genealogia até 4 gerações:
- **PO (Puro de Origem)**: 4 gerações puras da mesma raça
- **PC (Puro por Cruza)**: 3 gerações puras
- **PA (Puro por Avanço)**: 2 gerações puras
- **CCG (Controle de Cruzamento de Grau)**: 1 geração pura
- **SRD (Sem Raça Definida)**: Sem genealogia ou raça mista

### 3. **Validações de Genealogia**
- ❌ Búfalo não pode ser pai/mãe de si mesmo
- ❌ Pai e mãe não podem ser o mesmo animal
- ❌ Previne circularidade (pai não pode ser descendente do filho)

### 4. **Campos Enriquecidos**
Retorna automaticamente:
- `nomeRaca`: Nome da raça
- `brincoPai`: Brinco do pai (prioriza animal interno → material genético → identificador)
- `brincoMae`: Brinco da mãe (mesma lógica)
- `materialGeneticoMachoNome`: Nome do sêmen (apenas se sem pai interno)
- `materialGeneticoFemeaNome`: Nome do óvulo (apenas se sem mãe interna)

### 5. **Filtros Avançados**
- Sexo (M/F)
- Maturidade (B/N/V/T)
- Categoria ABCB (PO/PC/PA/CCG/SRD)
- Status (ativo/inativo)
- Raça
- Grupo
- Propriedade
- Faixa etária
- Pesquisa por nome/brinco

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
bufalo/
├── bufalo.controller.ts        # Endpoints REST
├── bufalo.service.ts            # Lógica de negócio principal
├── bufalo.module.ts             # Configuração do módulo
├── dto/                         # DTOs com validações
│   ├── create-bufalo.dto.ts
│   ├── update-bufalo.dto.ts
│   ├── filtro-bufalo.dto.ts
│   └── ...
├── repositories/                # Camada de persistência
│   └── bufalo.repository.drizzle.ts
├── services/                    # Serviços auxiliares
│   ├── bufalo-maturidade.service.ts
│   ├── bufalo-categoria.service.ts
│   └── bufalo-filtros.service.ts
└── utils/                       # Utilitários
    ├── validation.utils.ts
    └── categoria-abcb.util.ts
```

### Separação de Responsabilidades

#### **BufaloService** (Principal)
- Coordena operações CRUD
- Valida acesso e permissões
- Enriquece dados com campos derivados
- Delega cálculos para serviços especializados

#### **BufaloMaturidadeService**
- Calcula maturidade baseado em idade e sexo
- Atualiza maturidade automaticamente em queries
- Valida transições de maturidade

#### **BufaloCategoriaService**
- Calcula categoria ABCB baseado em genealogia
- Conta gerações puras
- Valida pureza de raça até 4 níveis

#### **BufaloFiltrosService**
- Processa filtros avançados
- Monta queries complexas
- Aplica ordenação e paginação

#### **BufaloRepositoryDrizzle**
- Abstrai acesso ao banco de dados
- Implementa queries otimizadas
- Previne N+1 query problem

## 🔐 Segurança e Autorização

### Autenticação JWT
Todos os endpoints exigem token Bearer JWT válido.

### Autorização por Propriedade
- Usuários só acessam búfalos de propriedades vinculadas (como dono ou funcionário)
- Validação automática em todas as operações
- Cache de 30s para propriedades do usuário (performance)

### Soft-Delete
- Búfalos inativos permanecem no banco (`deleted_at` preenchido)
- Podem ser restaurados se necessário
- Queries ignoram registros deletados por padrão

## 📊 Performance

### Otimizações Implementadas

1. **Batch Loading**: Carrega pais/mães em uma única query
2. **Cache Estratégico**: 
   - Propriedades do usuário: 30 segundos
   - Categorias: 10 minutos
3. **Índices no Banco**: 
   - `idPropriedade`, `idGrupo`, `idRaca`
   - `brinco`, `microchip` (unique)
4. **Eager Loading**: Carrega relacionamentos necessários de uma vez
5. **Paginação**: Limita quantidade de dados retornados

## 🧪 Regras de Negócio

### Status Automático
- Búfalos com idade > 50 anos são automaticamente inativados
- Status pode ser alterado manualmente (exceto para animais muito velhos)

### Genealogia
- Suporta genealogia natural (pai/mãe internos)
- Suporta reprodução assistida (material genético)
- Prioriza dados internos sobre material genético

### Categoria ABCB
- Calculada automaticamente se houver genealogia
- Requer que propriedade participe da ABCB
- Pode ser sobrescrita manualmente

## 📡 Exemplos de Uso

### Criar Búfalo

```typescript
POST /bufalos
Authorization: Bearer <token>

{
  "nome": "Valente",
  "brinco": "BR54321",
  "sexo": "M",
  "dtNascimento": "2023-05-20T00:00:00.000Z",
  "idPropriedade": "uuid-propriedade",
  "idRaca": "uuid-raca",
  "idPai": "uuid-pai",
  "idMae": "uuid-mae"
}
```

**Resposta:**
```json
{
  "idBufalo": "uuid-gerado",
  "nome": "Valente",
  "brinco": "BR54321",
  "sexo": "M",
  "nivelMaturidade": "N",
  "categoria": "PA",
  "nomeRaca": "Murrah",
  "brincoPai": "BR12345",
  "brincoMae": "BR67890",
  "status": true,
  "createdAt": "2026-02-04T15:30:00.000Z"
}
```

### Listar com Filtros

```typescript
GET /bufalos/filtros?sexo=F&nivelMaturidade=V&status=true&page=1&limit=20
Authorization: Bearer <token>
```

### Atualizar Grupo

```typescript
PATCH /bufalos/:id/grupo
Authorization: Bearer <token>

{
  "id_grupo_destino": "uuid-novo-grupo",
  "motivo": "Reorganização do rebanho"
}
```

## 🔧 Manutenção

### Adicionar Novo Filtro

1. Adicionar campo no `FiltroAvancadoBufaloDto`
2. Implementar lógica no `BufaloFiltrosService.buildFiltersObject()`
3. Adicionar query no `BufaloRepositoryDrizzle` se necessário

### Modificar Cálculo de Maturidade

Editar `BufaloMaturidadeService.calcularMaturidade()` com nova lógica.

### Ajustar Categoria ABCB

Modificar `BufaloCategoriaService.contarGeracoesPuras()` ou `CategoriaABCBUtil`.

## 🐛 Debug

### Logs Estruturados

```typescript
this.logger.log(`✅ Búfalo criado: ${nome}`);
this.loggerService.logError(error, { service: 'BufaloService', method: 'create' });
```

### Verificar Cache

```typescript
// Cache de propriedades do usuário
CacheKeys.userProperties(userId)

// TTL: CacheTTL.SHORT (30 segundos)
```

## 📚 Dependências Externas

- **GenealogiaService**: Constrói árvore genealógica
- **AuthHelperService**: Valida acesso do usuário
- **LoggerService**: Logs estruturados
- **CacheService**: Gerenciamento de cache

## ✅ Checklist de Validação

Ao criar/atualizar búfalo:
- [ ] Usuário tem acesso à propriedade?
- [ ] Genealogia não é circular?
- [ ] Data de nascimento não é futura?
- [ ] Sexo é válido (M/F)?
- [ ] Brinco/microchip não duplicado?
- [ ] Raça existe (se informado)?
- [ ] Grupo pertence à propriedade (se informado)?
- [ ] Pai/mãe existem e estão ativos (se informados)?

## 🚀 Melhorias Futuras

- [ ] Implementar versionamento de genealogia
- [ ] Adicionar suporte a múltiplos microchips
- [ ] Criar timeline de eventos do búfalo
- [ ] Implementar notificações de mudança de maturidade
- [ ] Integração com sistema de rastreabilidade nacional
