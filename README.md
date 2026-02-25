# VIRAZUL - Sistema de Gestão Financeira

Aplicação web frontend para o sistema VIRAZUL de gestão financeira pessoal, desenvolvida com React, Vite e React Router, incluindo sistema completo de autenticação e dashboard interativo.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Instalação e Configuração](#instalação-e-configuração)
- [Integração com API](#integração-com-api)
- [Componentes Implementados](#componentes-implementados)
- [Fluxo de Dados](#fluxo-de-dados)
- [Rotas](#rotas)
- [Autenticação](#autenticação)

## 🎯 Visão Geral

**VIRAZUL** é uma aplicação Single Page Application (SPA) para gerenciamento financeiro pessoal. O sistema permite que usuários se registrem, façam login, visualizem seu saldo calculado em tempo real, acompanhem entradas e saídas, e gerenciem lançamentos financeiros através de um dashboard intuitivo.

### Características Principais
- ✅ Sistema de autenticação completo (registro e login)
- ✅ Cálculo de saldo em tempo real no frontend
- ✅ Visualização de lançamentos com diferenciação visual
- ✅ Integração total com API REST Virazul
- ✅ Arquitetura escalável e organizada
- ✅ Interface responsiva e moderna

## 📁 Estrutura do Projeto

```
finance-web/
├── public/
├── src/
│   ├── api/
│   │   └── api.js                 # Serviço centralizado de API
│   ├── auth/
│   │   ├── AuthContext.jsx        # Context de autenticação
│   │   └── useAuth.js             # Hook customizado de autenticação
│   ├── pages/
│   │   ├── Login.jsx              # Página de login/registro
│   │   └── Dashboard.jsx          # Dashboard principal
│   ├── components/
│   │   └── Layout.jsx             # Layout com header e footer
│   ├── assets/
│   ├── router.jsx                 # Configuração de rotas
│   ├── App.jsx                    # Componente raiz
│   ├── App.css
│   ├── main.jsx                   # Entry point
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
```

## ✨ Funcionalidades

### 1. **Sistema de Autenticação**
- Registro de novos usuários (email + senha)
- Login de usuários existentes
- Logout seguro
- Persistência de sessão usando LocalStorage
- Proteção de rotas privadas
- Redirecionamento automático
- Token JWT em todas as requisições autenticadas

### 2. **Dashboard Financeiro**
- **Cálculo de saldo em tempo real** baseado em lançamentos
- Resumo de entradas totais
- Resumo de saídas totais
- Lista completa de lançamentos
- Interface responsiva e intuitiva
- Cards informativos com cores semânticas

### 3. **Gerenciamento de Lançamentos**
- Visualização de lançamentos em tabela estruturada
- Exibição de categoria, tipo, data e valor
- Diferenciação visual entre entradas e saídas
- Formatação monetária adequada (centavos → reais)
- Ordenação e apresentação clara dos dados

## 🛠 Tecnologias Utilizadas

### Core
- **React 19.2.0** - Biblioteca JavaScript para interfaces
- **Vite 7.3.1** - Build tool e dev server de alta performance
- **React Router DOM 7.x** - Roteamento client-side

### Desenvolvimento
- **ESLint** - Linter para qualidade de código
- **@vitejs/plugin-react** - Plugin Vite para React com Fast Refresh

## 🏗 Arquitetura

### Padrões Implementados

#### 1. **Context API**
Gerenciamento de estado global de autenticação:
- `AuthContext` - Provê estado (`user`, `token`) e funções (`login`, `registrar`, `logout`)
- Evita prop drilling
- Centraliza lógica de autenticação
- Sincronização com LocalStorage

#### 2. **Custom Hooks**
- `useAuth()` - Hook para acessar contexto de autenticação
- Validação de uso dentro do AuthProvider
- Interface limpa e reutilizável

#### 3. **Protected Routes**
- `Layout` component - Wrapper para rotas protegidas
- Redirecionamento automático para login se não autenticado
- Verificação de `isAuthenticated`

#### 4. **Separation of Concerns**
- API calls isolados em `src/api/api.js`
- Autenticação separada em módulo `src/auth/`
- Páginas e componentes organizados por responsabilidade
- Cálculos de negócio no frontend (saldo, totais)

#### 5. **Conversão de Valores**
- API trabalha com `valor_centavos` (integer)
- Frontend converte para reais apenas na renderização
- Funções utilitárias: `centavosParaReais()` e `reaisParaCentavos()`

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- API Virazul rodando (backend)

### Passos de Instalação

```bash
# Clonar o repositório
cd finance-web

# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Executar linter
npm run lint
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000
```

**Importante:** A URL da API não deve incluir `/api` no final, pois os endpoints já são completos (ex: `/auth/login`, `/lancamentos`).

## 🔌 Integração com API

### Endpoints da API Virazul

O frontend consome a seguinte API REST:

#### Autenticação
- `POST /auth/registrar` - Registrar novo usuário
- `POST /auth/login` - Login de usuário existente
- `GET /me` - Obter dados do usuário autenticado

#### Lançamentos
- `GET /lancamentos` - Listar todos os lançamentos do usuário
- `POST /lancamentos` - Criar novo lançamento

#### Contas
- `GET /contas` - Listar contas do usuário
- `POST /contas` - Criar nova conta

#### Categorias
- `GET /categorias` - Listar categorias
- `POST /categorias` - Criar nova categoria

### Estrutura de Dados

#### Lançamento
```javascript
{
  "id": 1,
  "descricao": "Salário",
  "valor_centavos": 500000,  // R$ 5.000,00
  "tipo": "entrada",          // "entrada" | "saida"
  "data": "2026-02-22",
  "categoria_nome": "Trabalho",
  "categoria_id": 1,
  "conta_id": 1
}
```

#### Resposta da API
A API encapsula arrays em objetos:
```javascript
{
  "lancamentos": [...]
}
```

### Headers de Autenticação
```javascript
{
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

## 🧩 Componentes Implementados

### 1. **App.jsx**
Componente raiz que integra providers:

```jsx
<AuthProvider>
  <RouterProvider router={router} />
</AuthProvider>
```

**Responsabilidades:**
- Integrar AuthContext
- Inicializar roteamento

### 2. **AuthContext.jsx**
Gerencia estado de autenticação global.

**Estado:**
- `user` - Dados do usuário (email, id, etc.)
- `token` - Token JWT
- `loading` - Estado de carregamento inicial

**Métodos:**
- `login(email, senha)` - Autentica usuário via API
- `registrar(email, senha)` - Registra novo usuário
- `logout()` - Remove autenticação

**Fluxo de Login/Registro:**
1. Chama `api.login()` ou `api.registrar()`
2. Recebe `{ token }`
3. Chama `api.getMe(token)` para obter dados do usuário
4. Armazena `user` e `token` no state e LocalStorage

**Persistência:**
- Usa `virazul_token` e `virazul_user` no LocalStorage
- Restaura sessão ao inicializar

### 3. **Login.jsx**
Página de autenticação unificada.

**Features:**
- Alternância entre modo login e registro
- Formulário com email e senha apenas
- Validação de campos obrigatórios
- Feedback de erros
- Loading states
- Redirecionamento pós-autenticação

**Interface:**
- Branding VIRAZUL
- Design limpo e moderno
- Responsivo

### 4. **Dashboard.jsx**
Painel principal do sistema.

**Funcionalidades:**
- Busca lançamentos via `api.getLancamentos(token)`
- **Calcula saldo localmente**:
  ```javascript
  saldo = Σ(entradas) - Σ(saidas)
  ```
- Exibe 3 cards:
  - Saldo Total (azul, muda cor se negativo)
  - Entradas (verde)
  - Saídas (vermelho)
- Tabela de lançamentos com:
  - Data formatada (pt-BR)
  - Descrição
  - Categoria
  - Tipo (badge colorido)
  - Valor formatado

**Cálculo de Resumo:**
```javascript
const calcularResumo = () => {
  let totalEntradas = 0;
  let totalSaidas = 0;

  lancamentos.forEach(lancamento => {
    if (lancamento.tipo === 'entrada') {
      totalEntradas += lancamento.valor_centavos;
    } else if (lancamento.tipo === 'saida') {
      totalSaidas += lancamento.valor_centavos;
    }
  });

  return {
    total: totalEntradas - totalSaidas,
    entradas: totalEntradas,
    saidas: totalSaidas
  };
};
```

### 5. **Layout.jsx**
Wrapper para páginas protegidas.

**Estrutura:**
- **Header:**
  - Logo VIRAZUL
  - Email do usuário
  - Botão de logout

- **Main:**
  - Conteúdo das páginas via `<Outlet />`
  - Container responsivo (max-width: 1200px)

- **Footer:**
  - Copyright VIRAZUL

**Proteção:**
- Verifica `isAuthenticated`
- Redireciona para `/login` se não autenticado

## 🔄 Fluxo de Dados

### Fluxo de Autenticação

```
┌─────────────┐
│   Login     │
│   (email,   │
│    senha)   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ api.login()     │
│ POST /auth/login│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  { token }      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ api.getMe()     │
│ GET /me         │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ AuthContext     │
│ setUser()       │
│ setToken()      │
│ localStorage    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Navigate to     │
│ /dashboard      │
└─────────────────┘
```

### Fluxo de Dashboard

```
┌─────────────────┐
│  Dashboard      │
│  useEffect()    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ api.getLancamentos()│
│ GET /lancamentos    │
└──────┬──────────────┘
       │
       ▼
┌───────────────────────┐
│ { lancamentos: [...] }│
└──────┬────────────────┘
       │
       ▼
┌────────────────────┐
│ setLancamentos()   │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ calcularResumo()   │
│ (no frontend)      │
│                    │
│ Σ entradas         │
│ Σ saidas           │
│ saldo = E - S      │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Renderiza:         │
│ - Cards de resumo  │
│ - Tabela           │
└────────────────────┘
```

## 🛣 Rotas

```javascript
/                   → Redireciona para /dashboard
/login              → Página de login/registro (pública)
/dashboard          → Dashboard principal (protegida)
/*                  → Redireciona para /login
```

### Proteção de Rotas
- Rotas sob o componente `Layout` exigem autenticação
- Usuários não autenticados são redirecionados para `/login`
- Após login bem-sucedido, redireciona para `/dashboard`
- Rota raiz (`/`) redireciona automaticamente para `/dashboard`

## 🔐 Autenticação

### Fluxo Completo

#### 1. **Registro de Novo Usuário**
```
Usuário preenche email e senha
       ↓
api.registrar(email, senha)
       ↓
API retorna { token }
       ↓
api.getMe(token)
       ↓
API retorna dados do usuário
       ↓
AuthContext armazena user + token
       ↓
LocalStorage persiste sessão
       ↓
Redireciona para /dashboard
```

#### 2. **Login de Usuário Existente**
```
Usuário preenche email e senha
       ↓
api.login(email, senha)
       ↓
API retorna { token }
       ↓
api.getMe(token)
       ↓
API retorna dados do usuário
       ↓
AuthContext armazena user + token
       ↓
LocalStorage persiste sessão
       ↓
Redireciona para /dashboard
```

#### 3. **Persistência de Sessão**
```
Aplicação carrega
       ↓
AuthContext useEffect verifica LocalStorage
       ↓
Se existir virazul_token e virazul_user
       ↓
Restaura estado de autenticação
       ↓
Usuário permanece logado
```

#### 4. **Logout**
```
Usuário clica em "Sair"
       ↓
AuthContext.logout()
       ↓
Remove user e token do state
       ↓
Remove do LocalStorage
       ↓
Layout detecta !isAuthenticated
       ↓
Redireciona para /login
```

### Segurança
- ✅ Token JWT armazenado em LocalStorage
- ✅ Token enviado em header `Authorization: Bearer <token>`
- ✅ Validação de autenticação em todas as rotas protegidas
- ✅ Tratamento de erros de autenticação
- ✅ Redirecionamento automático se não autenticado

## 🎨 Estilização

### Abordagem
- CSS inline para componentes
- Zero dependências de CSS externo
- Cores semânticas consistentes

### Paleta de Cores

| Elemento | Cor | Hex | Uso |
|----------|-----|-----|-----|
| Primário | Azul | `#1976d2` | Header, botões, saldo |
| Entradas | Verde | `#2e7d32` | Cards e valores de entrada |
| Saídas | Vermelho | `#c62828` | Cards e valores de saída |
| Background | Cinza Claro | `#f5f5f5` | Fundo da página |
| Cards | Verde Claro | `#e8f5e9` | Card de entradas |
| Cards | Vermelho Claro | `#ffebee` | Card de saídas |
| Cards | Azul Claro | `#e3f2fd` | Card de saldo |

### Responsividade
```css
/* Grid adaptativo para cards */
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 1rem;
```

- Container com `max-width: 1200px` para desktop
- Grid system com `auto-fit` e `minmax()`
- Design mobile-friendly
- Tabelas com overflow horizontal

## 📊 Conversão de Valores

### Sistema de Centavos

A API trabalha com valores em **centavos** (integer) para evitar problemas de precisão com ponto flutuante.

#### Funções Utilitárias (api.js)

```javascript
// Converter centavos para reais (string formatada)
export const centavosParaReais = (centavos) => {
  return (centavos / 100).toFixed(2);
};

// Converter reais para centavos (integer)
export const reaisParaCentavos = (reais) => {
  return Math.round(parseFloat(reais) * 100);
};
```

#### Exemplos de Uso

```javascript
// Renderização
<p>R$ {centavosParaReais(lancamento.valor_centavos)}</p>
// Resultado: R$ 5000.00 se valor_centavos = 500000

// Envio para API
const data = {
  valor_centavos: reaisParaCentavos(formValue)
};
```

## 🚀 Próximos Passos Sugeridos

### 1. **Funcionalidades**
- [ ] Formulário para adicionar lançamentos
- [ ] Editar/deletar lançamentos
- [ ] Filtros por data, tipo, categoria
- [ ] Busca de lançamentos
- [ ] Gráficos de receitas/despesas
- [ ] Exportar dados (PDF/Excel)
- [ ] Categorias customizadas pelo usuário
- [ ] Múltiplas contas
- [ ] Metas financeiras
- [ ] Relatórios mensais/anuais

### 2. **Melhorias Técnicas**
- [ ] Migrar para TypeScript
- [ ] Testes unitários (Vitest)
- [ ] Testes de integração
- [ ] Testes E2E (Cypress/Playwright)
- [ ] React Query para cache e sincronização
- [ ] State management (Zustand)
- [ ] CSS Modules ou Styled Components
- [ ] Otimização de bundle
- [ ] Code splitting
- [ ] PWA (Progressive Web App)

### 3. **UX/UI**
- [ ] Loading skeletons
- [ ] Toast notifications (react-hot-toast)
- [ ] Animações e transições
- [ ] Dark mode
- [ ] Acessibilidade (ARIA, keyboard navigation)
- [ ] Paginação de lançamentos
- [ ] Infinite scroll
- [ ] Drag and drop
- [ ] Gráficos interativos (Chart.js, Recharts)

### 4. **Segurança**
- [ ] Refresh tokens
- [ ] Expiração de token
- [ ] HTTPS only em produção
- [ ] CSRF protection
- [ ] Rate limiting no cliente
- [ ] Input sanitization
- [ ] Validação de formulários (Zod, Yup)
- [ ] Senha forte (requisitos)
- [ ] Redefinição de senha
- [ ] Autenticação em dois fatores (2FA)

### 5. **DevOps**
- [ ] CI/CD (GitHub Actions)
- [ ] Docker
- [ ] Deploy automatizado
- [ ] Monitoramento de erros (Sentry)
- [ ] Analytics (Google Analytics, Plausible)
- [ ] Performance monitoring

## 📝 Convenções de Código

### Nomenclatura
- Componentes: PascalCase (`Dashboard.jsx`, `AuthContext.jsx`)
- Funções/variáveis: camelCase (`calcularResumo`, `totalEntradas`)
- Constantes: UPPER_CASE (`API_BASE_URL`)
- Arquivos de hook: camelCase com prefixo `use` (`useAuth.js`)

### Estrutura de Arquivos
- Uma exportação principal por arquivo
- Named exports para utilitários
- Imports organizados: React → bibliotecas → internos

### Boas Práticas
- ✅ Destructuring de props
- ✅ Early returns
- ✅ Funções pequenas e focadas
- ✅ Comentários quando necessário
- ✅ Tratamento de erros
- ✅ Loading states
- ✅ Validação de dados da API

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. **Erro de CORS**
```
Access to fetch at 'http://localhost:3000/auth/login' has been blocked by CORS policy
```
**Solução:** Certifique-se de que o backend está configurado para aceitar requisições da origem do frontend.

#### 2. **Token não persistindo**
```
Usuário é deslogado ao recarregar a página
```
**Solução:** Verifique se `virazul_token` e `virazul_user` estão no LocalStorage.

#### 3. **Valores incorretos**
```
Valores aparecem com muitos zeros
```
**Solução:** Certifique-se de usar `centavosParaReais()` na renderização.

#### 4. **Erro 401 em requisições**
```
Failed to fetch: 401 Unauthorized
```
**Solução:** Verifique se o token está sendo enviado corretamente no header `Authorization`.

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de demonstração.

---

**VIRAZUL - Sistema de Gestão Financeira**  
Desenvolvido com React + Vite | Fevereiro 2026
