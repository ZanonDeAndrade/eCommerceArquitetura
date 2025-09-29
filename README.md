# eCommerceArquitetura

Projeto de referência para uma arquitetura de microsserviços em um cenário de e-commerce. O objetivo é demonstrar como dividir responsabilidades (usuários, produtos, pedidos, pagamentos e notificações por email) e orquestrar tudo com Docker Compose.

## Visão geral

| Serviço            | Porta local | Responsabilidade principal                            |
|--------------------|-------------|--------------------------------------------------------|
| users-service      | 3002        | CRUD de usuários em PostgreSQL                        |
| products-service   | 3003        | CRUD de produtos, controle de estoque e alertas       |
| order-service      | 3001        | Criação e consulta de pedidos (MongoDB)               |
| payment-service    | 3004        | Registro de pagamentos e confirmação/cancelamento     |
| email-service      | 3005        | Simulação de envio de emails (Nodemailer + JSON)      |
| postgres-*         | 5433-5435   | Bancos PostgreSQL por domínio                         |
| mongo-orders       | 27018       | Banco MongoDB (replica set rs0) usado pelo pedido     |
| pgadmin / mongo-express | 5050 / 8081 | UIs opcionais para inspeção dos bancos          |

### Fluxo principal
1. `users-service` mantém os clientes.
2. `products-service` manipula catálogo e estoque. Quando o estoque fica abaixo do limite configurado, dispara uma notificação para o `email-service`.
3. `order-service` recebe pedidos, valida usuário/produtos via HTTP e grava no MongoDB.
4. `payment-service` aceita o pagamento (apenas uma vez, com o valor total) e confirma o status do pedido. Em seguida consulta o email do cliente e chama o `email-service` para notificar.
5. `email-service` registra envios simulados no log (`jsonTransport` do Nodemailer).

## Pré-requisitos

- Docker e Docker Compose instalados
- Make (opcional) ou terminal com `sudo`

## Como executar

```bash
sudo docker compose down -v           # opcional: limpa bancos anteriores
sudo docker compose build            # constrói todas as imagens
sudo docker compose up               # inicia toda a stack
```

Para acompanhar algum serviço específico:

```bash
sudo docker compose logs -f users-service
sudo docker compose logs -f email-service
```

> **Nota:** a configuração do MongoDB usa replica set (`rs0`). O serviço `mongo-orders-init` cuida de ativar automaticamente.

## Testando com Postman / HTTP

### Usuários (users-service)
- `POST http://localhost:3002/users`
  ```json
  { "name": "Ana Souza", "email": "ana@example.com" }
  ```
- `GET http://localhost:3002/users`
- `GET http://localhost:3002/users/1`

### Produtos (products-service)
- `POST http://localhost:3003/products`
  ```json
  { "name": "Notebook", "price": 3999.90, "stock": 10 }
  ```
- `PATCH http://localhost:3003/products/1/decrement-stock`
  ```json
  { "quantity": 3 }
  ```
  Quando o estoque atingir (ou ficar abaixo de) `LOW_STOCK_THRESHOLD`, o serviço chama o `email-service`.

### Pedidos (order-service)
- `POST http://localhost:3001/orders`
  ```json
  {
    "userId": 1,
    "items": [
      { "productId": 1, "quantity": 2 }
    ]
  }
  ```
- `GET http://localhost:3001/orders`
- `GET http://localhost:3001/orders/{orderId}` *(ObjectId retornado na criação)*

### Pagamentos (payment-service)
- `POST http://localhost:3004/payments/confirm`
  ```json
  {
    "orderId": "<ObjectId do pedido>",
    "payments": [
      { "method": "PIX", "amount": 799.80 }
    ]
  }
  ```
  - Valida se o pedido existe
  - Impede pagamentos duplicados (`PAID`/`CANCELLED`)
  - Checa se a soma dos pagamentos é igual ao total do pedido
  - Atualiza status para `PAID`
  - Aciona o `email-service`

### Emails (email-service)
- `POST http://localhost:3005/emails/payment/confirmation`
- `POST http://localhost:3005/emails/payment/cancellation`
- `POST http://localhost:3005/emails/inventory/low-stock`

Todos os envios são registrados nos logs; verifique com:

```bash
sudo docker compose logs -f email-service
```

## Variáveis de ambiente importantes

| Serviço            | Variável                                | Descrição                                        |
|--------------------|------------------------------------------|--------------------------------------------------|
| order-service      | `DATABASE_URL`                           | Nome do banco Mongo com `replicaSet=rs0`         |
| products-service   | `EMAIL_SERVICE_URL`, `SUPPLIER_EMAIL`, `LOW_STOCK_THRESHOLD` | Integração para alertas de estoque |
| payment-service    | `ORDER_API_URL`, `USERS_SERVICE_URL`, `EMAIL_SERVICE_URL`    | Serviços consultados pela API                   |
| email-service      | `MAIL_FROM`, `PORT`                      | Remetente padrão e porta do microserviço         |

## Estrutura do repositório

```
├─ docker-compose.yml
├─ users-service/
├─ products-service/
├─ order-service/
├─ payment-service/
├─ email-service/
├─ postgres-*/ (volumes Docker)
└─ ...
```

Cada microsserviço segue a mesma estrutura base (TypeScript, Express e Dockerfile multi-stage).
