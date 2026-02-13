# 🏗️ Infraestrutura BUFFS API

Esta pasta contém a configuração de infraestrutura para desenvolvimento local.

## 📦 Serviços Disponíveis

### 🐰 RabbitMQ (Ativo)
Message broker para processamento assíncrono de alertas.

- **AMQP:** `localhost:5672`
- **Management UI:** http://localhost:15672
- **Credenciais:** `admin` / `admin`

### 🐘 PostgreSQL (Desabilitado)
Banco de dados relacional. Atualmente usando **Supabase** remoto.

Para ativar localmente, descomente no `docker-compose.yml`.

### 🔴 Redis (Desabilitado)
Cache distribuído. Atualmente usando cache em memória do NestJS.

Para ativar, descomente no `docker-compose.yml`.

---

## 🚀 Comandos Úteis

### Gerenciamento Geral

```bash
# Subir todos os serviços ativos
docker-compose -f infra/docker-compose.yml up -d

# Ver logs em tempo real
docker-compose -f infra/docker-compose.yml logs -f

# Ver logs de um serviço específico
docker-compose -f infra/docker-compose.yml logs -f rabbitmq

# Parar todos os serviços
docker-compose -f infra/docker-compose.yml down

# Parar e remover volumes (⚠️ apaga dados)
docker-compose -f infra/docker-compose.yml down -v

# Ver status dos serviços
docker-compose -f infra/docker-compose.yml ps
```

### RabbitMQ Específico

```bash
# Acessar shell do container
docker exec -it buffs-rabbitmq sh

# Ver queues via CLI
docker exec buffs-rabbitmq rabbitmqctl list_queues

# Ver exchanges
docker exec buffs-rabbitmq rabbitmqctl list_exchanges

# Ver bindings
docker exec buffs-rabbitmq rabbitmqctl list_bindings

# Resetar RabbitMQ (⚠️ apaga todas as filas)
docker exec buffs-rabbitmq rabbitmqctl stop_app
docker exec buffs-rabbitmq rabbitmqctl reset
docker exec buffs-rabbitmq rabbitmqctl start_app
```

---

## 🔍 Troubleshooting

### RabbitMQ não conecta

1. Verificar se o container está rodando:
   ```bash
   docker ps | grep rabbitmq
   ```

2. Ver logs de erro:
   ```bash
   docker-compose -f infra/docker-compose.yml logs rabbitmq
   ```

3. Testar conexão manual:
   ```bash
   curl http://localhost:15672/api/overview -u admin:admin
   ```

### Porta já em uso

Se a porta `5672` ou `15672` já estiver em uso:

```bash
# Descobrir qual processo está usando
sudo lsof -i :5672
sudo lsof -i :15672

# Matar o processo (substitua PID)
kill -9 <PID>
```

Ou altere as portas no `docker-compose.yml`:
```yaml
ports:
  - "5673:5672"    # Porta externa alterada
  - "15673:15672"
```

---

## 📝 Adicionando Novos Serviços

Para adicionar um novo serviço (exemplo: ElasticSearch):

1. Adicione o serviço no `docker-compose.yml`:
   ```yaml
   elasticsearch:
     image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
     container_name: buffs-elasticsearch
     environment:
       - discovery.type=single-node
     ports:
       - "9200:9200"
     volumes:
       - elasticsearch_data:/usr/share/elasticsearch/data
     networks:
       - buffs-network
   ```

2. Adicione o volume:
   ```yaml
   volumes:
     elasticsearch_data:
       driver: local
   ```

3. Suba o novo serviço:
   ```bash
   docker-compose -f infra/docker-compose.yml up -d elasticsearch
   ```

---

## 🔐 Segurança

⚠️ **ATENÇÃO:** As credenciais padrão são apenas para desenvolvimento local.

**NUNCA** use estas credenciais em produção:
- RabbitMQ: `admin` / `admin`
- PostgreSQL: `postgres` / `postgres`

Para produção, use variáveis de ambiente seguras e gerencie via secrets do orquestrador (Kubernetes, AWS Secrets Manager, etc).

---

## 📚 Referências

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)
