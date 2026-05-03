# GuessWord

GuessWord é uma plataforma full-stack para aprender inglês com vocabulário adaptativo, prática com revisão espaçada e partidas multijogador.

## O que é

Este projeto combina um backend Laravel com um frontend Next.js para entregar:
- Treinos de vocabulário por nível (A1 a C2)
- Revisões inteligentes baseadas em progresso do usuário
- Sistema de pontuação com combo e tempo de resposta
- Autenticação por e-mail e login via Google (OAuth)
- Modo multijogador com salas, ranking e partidas em tempo real
- Histórico local de tentativas e progresso do usuário

## Arquitetura

- `backend/` — API REST em Laravel 13 e PHP 8.3
- `frontend/` — interface em Next.js 16 + React 19 com Tailwind CSS

## Funcionalidades principais

### Backend
- Cadastro e login de usuário
- Login Gmail via OAuth 2.0
- Listagem de palavras por nível
- Seleção de desafio com peso para revisão, visto e automático
- Registro de tentativas e cálculo de progresso
- Perfil de usuário com XP, streak e histórico
- Ranking global (leaderboard)
- Criação e gerenciamento de salas multijogador
- Sistema de pontuação baseado em nível, velocidade e combo

### Frontend
- Responsividade e interface para estudo diário
- Persistência de sessão e progresso no `localStorage`
- Opções de prática: nível, revisão, palavras já vistas e modo automático
- Tela de multijogador com código de sala e placar
- Feedback em tempo real para respostas corretas/erradas

## Tecnologias

### Backend
- Laravel 13
- PHP ^8.3
- SQLite (padrão) ou outro banco configurado
- Composer

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Vite (para build do backend se necessário)

## Instalação

### Backend

1. Abra um terminal em `backend/`
2. Instale dependências:
   ```bash
   composer install
   ```
3. Crie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
4. Gere a chave da aplicação:
   ```bash
   php artisan key:generate
   ```
5. Se usar SQLite, crie o arquivo de banco de dados:
   ```bash
   touch database/database.sqlite
   ```
   No Windows PowerShell:
   ```powershell
   New-Item -ItemType File database\database.sqlite
   ```
6. Rode as migrations e o seeder:
   ```bash
   php artisan migrate --force
   php artisan db:seed
   ```
7. Inicie o servidor Laravel:
   ```bash
   php artisan serve
   ```

### Frontend

1. Abra outro terminal em `frontend/`
2. Instale dependências:
   ```bash
   npm install
   ```
3. Configure a URL da API, se necessário:
   Crie um arquivo `.env.local` com:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
   ```
   O frontend usa este valor ou `http://127.0.0.1:8000/api` como padrão.
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Variáveis de ambiente importantes

### Backend (`backend/.env`)
- `APP_URL` — URL base da API
- `DB_CONNECTION` — conexão do banco de dados (`sqlite` por padrão)
- `GOOGLE_CLIENT_ID` — ID do cliente Google OAuth
- `GOOGLE_CLIENT_SECRET` — segredo do cliente Google OAuth
- `GOOGLE_REDIRECT_URI` — URL de callback (padrão: `http://127.0.0.1:8000/api/auth/google-callback`)

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` — URL completa da API Laravel

## Endpoints principais da API

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/google-url`
- `GET /api/auth/google-callback`
- `GET /api/words?level={A1|A2|B1|B2|C1|C2}`
- `GET /api/challenge?client_id={id}&level={nivel}&mode={level|review|seen|auto}`
- `POST /api/attempts`
- `GET /api/progress?client_id={id}`
- `GET /api/leaderboard`
- `POST /api/multiplayer/rooms`
- `GET /api/multiplayer/rooms/{code}`
- `POST /api/multiplayer/rooms/{code}/join`
- `POST /api/multiplayer/rooms/{code}/attempts`

## Como rodar tudo

1. Inicie o backend do Laravel:
   ```bash
   cd backend
   php artisan serve
   ```
2. Inicie o frontend do Next.js:
   ```bash
   cd frontend
   npm run dev
   ```
3. Acesse a interface no navegador em `http://127.0.0.1:3000`

## Testes

### Backend
- Execute:
  ```bash
  cd backend
  php artisan test
  ```

### Frontend
- Execute lint:
  ```bash
  cd frontend
  npm run lint
  ```

## Observações

- O backend usa valores de `client_id` persistidos no navegador para rastrear progresso e leaderboard.
- O seeder padrão insere um conjunto inicial de palavras em níveis A1 a C2.
- O modo multijogador gera salas com código alfanumérico e calcula pontuação com combo e velocidade.

## Estrutura de pastas

- `backend/` — API Laravel, models, controllers, migrations e seeders
- `frontend/` — aplicação Next.js, página principal e lógica de estudo

---

Pronto para usar e evoluir como aplicação de estudo de vocabulário em inglês.