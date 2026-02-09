# Checklist de Testes - Repositories Refatorados

## ✅ Já Testados e Corrigidos
- [x] RetiradaRepository - POST /retiradas (corrigido)

## 🔍 A Testar

### Alta Prioridade (usados frequentemente)
- [ ] PropriedadeRepository - GET /propriedades/:id
- [ ] EnderecoRepository - POST /enderecos  
- [ ] BufaloRepository (não foi refatorado)

### Média Prioridade (refatorados)
- [ ] RacaRepository - GET /racas, POST /racas
- [ ] GrupoRepository - GET /grupos, POST /grupos
- [ ] LoteRepository - GET /lotes, POST /lotes
- [ ] MedicamentosRepository - GET /medicamentos

### Baixa Prioridade (menos usados)
- [ ] DadosZootecnicosRepository
- [ ] MovLoteRepository
- [ ] MaterialGeneticoRepository

## Padrões Identificados

### Problema 1: Nome da propriedade inconsistente
- Alguns: `private readonly db`
- Outros: `private readonly databaseService`
- **Solução**: Padronizar para `databaseService`

### Problema 2: Uso de sanitizeForDrizzle
- RetiradaRepository estava usando
- **Solução**: Insert direto com tipos do Drizzle

### Problema 3: Try-catch faltando
- Alguns repositories não têm tratamento de erro
- **Solução**: Adicionar InternalServerErrorException
