# GuessWord

GuessWord é uma plataforma full-stack para aprender inglês com vocabulário adaptativo, prática com revisão espaçada e partidas multijogador.

---

## ⚠️ STATUS DO PROJETO
> [!IMPORTANT]
> - **O projeto anteriormente utilizava um backend hospedado em produção.**
> - **Esse backend foi descontinuado.**
> - **Atualmente o projeto funciona apenas em modo local (localhost).**
> - Existe a possibilidade de o backend ser reativado no futuro, portanto, as opções e lógicas de integração com o backend online foram preservadas e podem ser reativadas através do botão de alternância de modo.

---

## Como Funciona o Modo Local

A aplicação conta com um seletor unificado de API (**🔌 Local / Produção**) localizado:
1. No canto superior direito da tela de Login/Cadastro.
2. Na barra de navegação superior (`Topbar`) após efetuar o login.

- **🔌 Local: Ativo (Recomendado)**: A aplicação direciona todas as chamadas à API para o seu backend local (`http://127.0.0.1:8000/api`).
- **🔌 Produção**: A aplicação direciona as chamadas para a URL configurada no seu `.env.local` (apontando para o servidor de produção).

---

## Requisitos Prévios

Antes de começar, você precisará ter instalado em sua máquina:
- **PHP** (versão 8.2 ou superior)
- **Composer** (gerenciador de dependências PHP)
- **Node.js** (versão 18 ou superior)
- **NPM** (gerenciador de pacotes Node)

---

## Instalação e Inicialização Passo a Passo

### 1. Configurando o Backend (Laravel)

1. Abra um terminal na pasta `backend/`:
   ```bash
   cd backend
   ```

2. Instale as dependências do Composer:
   ```bash
   composer install
   ```

3. Crie o arquivo de configuração de ambiente `.env`:
   ```bash
   cp .env.example .env
   ```

4. Gere a chave única da aplicação:
   ```bash
   php artisan key:generate
   ```

5. **Configuração do Banco de Dados SQLite**:
   O backend está pré-configurado no arquivo `.env` para usar um banco de dados **SQLite** local.
   - O projeto já possui um banco de dados SQLite pré-populado com as palavras e progresso em `backend/database/database.sqlite`.
   - Certifique-se de que a variável `DB_DATABASE` no seu arquivo `backend/.env` aponta para o caminho absoluto ou relativo correto do arquivo sqlite. Exemplo:
     ```env
     DB_CONNECTION=sqlite
     DB_DATABASE=database/database.sqlite
     ```
   - *Opcional*: Caso queira limpar o banco de dados e recriá-lo com dados novos do seeder padrão do Laravel, rode:
     ```bash
     php artisan migrate:fresh --seed
     ```

6. Inicie o servidor local do Laravel:
   ```bash
   php artisan serve
   ```
   O servidor estará ativo em `http://127.0.0.1:8000`.

---

### 2. Configurando o Frontend (Next.js)

1. Abra outro terminal na pasta `frontend/`:
   ```bash
   cd frontend
   ```

2. Instale as dependências do Node:
   ```bash
   npm install
   ```

3. Crie o arquivo `.env.local` (opcional se quiser definir portas ou URLs de produção customizadas):
   ```bash
   cp .env.example .env.local
   ```
   *Nota: Por padrão, o frontend tentará conectar em `http://127.0.0.1:8000/api` se nenhuma variável for informada.*

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação Next.js estará acessível em `http://localhost:3000`.

---

## Estrutura de Diretórios

- `/backend` — API REST construída em Laravel e banco SQLite local.
- `/frontend` — Lógica e interface web criadas com Next.js 16 + React 19.
- `/frontend/src/services/apiClient.ts` — Wrapper de chamadas HTTP unificado.
- `/frontend/src/store/LocalModeContext.tsx` — Contexto React para estado do modo local.
