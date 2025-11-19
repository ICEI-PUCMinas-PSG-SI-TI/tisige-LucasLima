# FoodFlow ERP - Sistema de Gestão para Restaurantes

## 📋 Sobre o Projeto

Este sistema foi desenvolvido como parte do **Trabalho Prático da disciplina de Trabalho Interdisciplinar: Sistemas Integrados de Gestão Empresarial**, ministrada no curso de **Sistemas de Informação da PUC Minas**.

O FoodFlow ERP é um sistema integrado de gestão empresarial (ERP) voltado para o setor de alimentação, oferecendo controle completo sobre operações de restaurantes, desde o gerenciamento de mesas e pedidos até o controle de estoque e equipe.

## 🎯 Objetivos do Sistema

- Automatizar processos operacionais de restaurantes
- Facilitar a comunicação entre diferentes áreas (atendimento, cozinha, administração)
- Proporcionar controle em tempo real de pedidos e estoque
- Oferecer visibilidade digital para clientes através de contas digitais
- Gerenciar múltiplas unidades de forma centralizada

## 🏗️ Arquitetura e Estrutura do Código

### Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: Supabase Auth
- **Roteamento**: React Router DOM v6
- **Gerenciamento de Estado**: React Query (TanStack Query)
- **Validação**: Zod + React Hook Form

### Estrutura de Diretórios

```
src/
├── assets/                    # Recursos estáticos (logos, imagens)
├── components/
│   ├── ui/                   # Componentes base do shadcn/ui
│   ├── admin/                # Componentes da área administrativa
│   │   ├── KitchenManagement.tsx
│   │   ├── MenuManagement.tsx
│   │   ├── StockManagement.tsx
│   │   ├── UserManagement.tsx
│   │   └── UnitsManagement.tsx
│   ├── waiter/               # Componentes da área do garçom
│   │   ├── TableList.tsx
│   │   ├── OrderDialog.tsx
│   │   └── NewTableDialog.tsx
│   └── ProtectedRoute.tsx    # Componente de proteção de rotas
├── contexts/
│   └── AuthContext.tsx       # Contexto de autenticação
├── hooks/                    # Hooks personalizados
├── integrations/
│   └── supabase/            # Configuração e tipos do Supabase
│       ├── client.ts
│       └── types.ts
├── lib/
│   ├── utils.ts             # Utilitários gerais
│   └── qrcode.ts            # Geração de QR codes
├── pages/
│   ├── Index.tsx            # Página inicial
│   ├── Auth.tsx             # Autenticação de usuários
│   ├── Setup.tsx            # Configuração inicial do sistema
│   ├── Admin.tsx            # Dashboard administrativo
│   ├── Waiter.tsx           # Interface do garçom
│   ├── Kitchen.tsx          # Interface da cozinha
│   ├── KitchenLogin.tsx     # Login específico da cozinha
│   ├── Bill.tsx             # Visualização de conta digital
│   ├── Unauthorized.tsx     # Página de acesso negado
│   └── NotFound.tsx         # Página 404
└── App.tsx                  # Componente principal com rotas

supabase/
├── functions/               # Edge Functions (serverless)
│   ├── create-user/
│   ├── update-user/
│   ├── soft-delete-user/
│   ├── create-kitchen/
│   ├── update-kitchen/
│   ├── generate-bill-token/
│   ├── get-bill-data/
│   └── submit-consent/
└── config.toml             # Configuração do Supabase
```

### Modelo de Dados

#### Tabelas Principais

1. **profiles** - Perfis de usuários
   - Armazena informações dos usuários (nome completo, unidade)
   - Suporta soft delete (deleted_at)

2. **user_roles** - Papéis dos usuários
   - Define permissões (admin, waiter, kitchen)
   - Associa usuários a unidades específicas

3. **units** - Unidades/Filiais
   - Gerencia diferentes localizações do restaurante

4. **menu_items** - Itens do cardápio
   - Produtos, preços, categorias, disponibilidade
   - Receitas (ingredients/insumos necessários)

5. **tables** - Mesas do restaurante
   - Status (available, occupied, closed, waiting_payment)
   - Cliente, garçom responsável, valores

6. **orders** - Pedidos
   - Itens solicitados por mesa
   - Status (pending, preparing, ready, delivered)
   - Rastreamento temporal

7. **insumos** - Estoque de insumos
   - Controle de quantidade e unidade de medida

8. **bill_tokens** - Tokens de conta digital
   - Tokens temporários para acesso seguro às contas

9. **consent_log** - Log de consentimento LGPD
   - Registro de consentimentos de clientes

## 🎭 Funcionalidades por Perfil

### 👨‍💼 Administrador

- **Gerenciamento de Cardápio**
  - CRUD completo de itens
  - Definição de receitas e insumos necessários
  - Controle de disponibilidade

- **Controle de Estoque**
  - Cadastro e edição de insumos
  - Monitoramento de quantidades

- **Gerenciamento de Usuários**
  - Criação de usuários (garçons e cozinha)
  - Atribuição de papéis e unidades
  - Soft delete de usuários

- **Gestão de Unidades**
  - Cadastro de filiais/unidades
  - Configuração de endereços

- **Gestão de Cozinhas**
  - Criação de acessos para cozinha
  - Atribuição de unidades

### 👨‍🍳 Garçom (Waiter)

- **Controle de Mesas**
  - Abertura de novas mesas
  - Visualização de status em tempo real
  - Fechamento de contas

- **Gerenciamento de Pedidos**
  - Criação de pedidos por mesa
  - Seleção de itens do cardápio
  - Adição de observações
  - Visualização de histórico

- **Conta Digital**
  - Geração de QR Code para cliente
  - Compartilhamento de link da conta
  - Visualização de valores totais

### 🍳 Cozinha (Kitchen)

- **Visualização de Pedidos**
  - Lista de todos os pedidos pendentes
  - Filtragem por status
  - Organização por mesa

- **Atualização de Status**
  - Marcar pedidos como "em preparo"
  - Marcar pedidos como "prontos"
  - Notificações visuais

- **Sistema de Login Simplificado**
  - Acesso via código numérico de 5 dígitos
  - Interface otimizada para ambiente de cozinha

### 👤 Cliente (Público)

- **Visualização de Conta Digital**
  - Acesso via QR Code ou link
  - Lista de itens consumidos
  - Valores individuais e total
  - Interface responsiva

## 🔐 Segurança e Autenticação

### Row Level Security (RLS)

Todas as tabelas implementam políticas RLS do PostgreSQL para garantir que:
- Usuários só acessem dados de suas unidades
- Garçons vejam apenas suas próprias mesas e pedidos
- Cozinha acesse pedidos da unidade atribuída
- Administradores tenham controle sobre sua unidade

### Autenticação

- Sistema de login com email e senha
- Login simplificado para cozinha (código numérico)
- Tokens JWT gerenciados pelo Supabase Auth
- Sessões persistentes com refresh automático

### LGPD Compliance

- Sistema de registro de consentimento de clientes
- Armazenamento de logs de consentimento com timestamp
- Soft delete de usuários (preservação de dados para auditoria)

## 🚀 Fluxo de Uso do Sistema

### 1. Configuração Inicial (Setup)
- Criação do primeiro administrador
- Definição da primeira unidade
- Configuração automática do banco de dados

### 2. Configuração Administrativa
- Admin cria usuários (garçons e cozinhas)
- Cadastra itens do cardápio
- Registra insumos no estoque
- Define receitas dos pratos

### 3. Operação Diária

**Fluxo do Garçom:**
1. Faz login no sistema
2. Abre uma nova mesa (número + nome do cliente)
3. Adiciona pedidos à mesa
4. Acompanha status dos pedidos
5. Gera QR Code/link da conta para o cliente
6. Fecha a mesa após pagamento

**Fluxo da Cozinha:**
1. Acessa com código numérico
2. Visualiza pedidos pendentes
3. Marca pedido como "em preparo"
4. Finaliza e marca como "pronto"
5. Pedido aparece como "entregue" para o garçom

**Fluxo do Cliente:**
1. Recebe QR Code do garçom
2. Escaneia e acessa conta digital
3. Visualiza todos os itens consumidos
4. Verifica valor total

## 📱 Responsividade

O sistema foi desenvolvido com design responsivo, funcionando perfeitamente em:
- Desktops (interface administrativa completa)
- Tablets (ideal para garçons)
- Smartphones (acesso à conta digital pelos clientes)

## 🔮 Sugestões de Trabalhos Futuros

### 1. **Módulo Financeiro**
- Controle de fluxo de caixa
- Relatórios de vendas por período
- Análise de rentabilidade por item
- Integração com sistemas de pagamento (PIX, cartões)
- Gestão de despesas e fornecedores

### 2. **Business Intelligence e Analytics**
- Dashboard com métricas de desempenho
- Análise de vendas por categoria/horário
- Previsão de demanda com Machine Learning
- Relatórios de performance de garçons
- Análise de itens mais vendidos/menos vendidos
- Heatmap de ocupação de mesas

### 3. **Gestão de Estoque Avançada**
- Integração com fornecedores
- Alertas de estoque mínimo
- Sugestões automáticas de compra
- Controle de validade de produtos
- Rastreabilidade de lotes
- Cálculo automático de custo por prato (precificação)

### 4. **Gestão de Relacionamento com Cliente (CRM)**
- Cadastro de clientes
- Programa de fidelidade/pontos
- Histórico de consumo
- Campanhas de marketing personalizadas
- Sistema de avaliações e feedback
- Integração com WhatsApp para reservas

### 5. **Recursos Humanos**
- Controle de ponto eletrônico
- Gestão de escalas de trabalho
- Cálculo de comissões
- Avaliação de desempenho
- Treinamentos e certificações

### 6. **Gestão de Reservas**
- Sistema de reservas online
- Confirmação automática por email/SMS
- Gestão de eventos e grupos
- Layout de mesas configurável

### 7. **Integrações Externas**
- iFood, Rappi, Uber Eats (delivery)
- Sistemas de nota fiscal eletrônica
- Plataformas de pagamento
- Sistemas contábeis
- ERPs maiores (SAP, TOTVS)

### 8. **Melhorias de UX/UI**
- Modo escuro completo
- Personalização de temas por unidade
- Atalhos de teclado
- Modo offline com sincronização
- PWA (Progressive Web App)
- Notificações push

### 9. **Automações e IA**
- Chatbot para atendimento
- Reconhecimento de voz para pedidos
- Sugestões inteligentes de combinações
- Detecção de fraudes
- Otimização automática de preços

### 10. **Compliance e Governança**
- Auditoria completa de operações
- Logs detalhados de todas as ações
- Backup automático
- Recuperação de desastres
- Certificações de segurança (ISO 27001)

### 11. **Expansão Funcional**
- Suporte multi-idioma
- Multi-moeda para operações internacionais
- Gestão de franquias
- Marketplace de insumos
- Sistema de delivery próprio

### 12. **Performance e Escalabilidade**
- Cache distribuído (Redis)
- CDN para assets
- Otimização de queries
- Load balancing
- Microserviços para módulos específicos

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ e npm
- Conta no Supabase (ou usar Lovable Cloud)

### Instalação

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>

# Entre no diretório
cd <NOME_DO_PROJETO>

# Instale as dependências
npm install

# Configure as variáveis de ambiente (.env)
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave

# Execute o projeto
npm run dev
```

### Primeiro Acesso
1. Acesse `http://localhost:5173/setup`
2. Crie o primeiro administrador
3. Configure sua primeira unidade
4. Comece a usar o sistema!

## 👥 Equipe de Desenvolvimento

Desenvolvido por alunos do curso de Sistemas de Informação da PUC Minas como parte do Trabalho Interdisciplinar de Sistemas Integrados de Gestão Empresarial.

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.

## 🙏 Agradecimentos

- Prof. [Nome do Professor] - Orientação e supervisão
- PUC Minas - Infraestrutura e suporte acadêmico
- Comunidade open-source - Bibliotecas e ferramentas utilizadas

---

**Disciplina:** Trabalho Interdisciplinar: Sistemas Integrados de Gestão Empresarial  
**Instituição:** Pontifícia Universidade Católica de Minas Gerais (PUC Minas)  
**Curso:** Sistemas de Informação  
**Ano:** 2025
