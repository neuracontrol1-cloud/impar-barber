# 🚀 Transformando este Projeto em um "Molde" para Novos Clientes

Como você finalizou a **Barbearia**, você agora tem um sistema completo (agendamento, painel, relatórios) que pode ser replicado para qualquer salão, barbearia ou estética!

Aqui está o passo a passo exato de como criar uma cópia "limpa" para um cliente novo, sem estragar o projeto original.

---

## 📂 Passo 1: Duplicar a Pasta Base

1. No seu computador, vá até a pasta `Documents\Antigravity`.
2. Clique na pasta **Barbearia** e copie (`Ctrl+C`).
3. Cole no mesmo local (`Ctrl+V`). Isso vai criar uma pasta "Barbearia - Cópia".
4. Renomeie essa nova pasta para o nome do novo cliente (ex: **SalaoDoJoao**).

---

## 🧹 Passo 2: Limpar o Histórico (Git)
A sua pasta antiga está "amarrada" ao seu GitHub antigo. Precisamos soltar essa amarra na pasta nova.

1. Entre na pasta nova (**SalaoDoJoao**).
2. Vá no topo do seu Explorador de Arquivos (Windows) -> Clique na aba **"Exibir"** -> Marque a caixa **"Itens ocultos"**.
3. Você verá uma pasta com o nome `.git` (meio transparente). **Apague essa pasta `.git`**.
   *(Isso faz com que o projeto esqueça que já esteve no GitHub antigo).*

---

## 🎨 Passo 3: Personalizar o Código do Cliente
Agora abra a pasta nova no seu editor de código (Cursor/VSCode).

1. **Nome do Projeto (Opcional):** Vá no arquivo `package.json` e mude a linha `"name": "barbearia"` para `"name": "salao-do-joao"`.
2. **Textos e Nomes:** Faça uma pesquisa global (`Ctrl+Shift+F`) pela palavra "Barbearia" e troque pelo nome do novo projeto (ex: na tela de `Login.tsx`, `AdminDashboard.tsx`, e nas mensagens de WhatsApp).
3. **Cores:** Se o salão novo tiver uma cor diferente de dourado/âmbar, você pode mudar as cores principais no arquivo `index.css` (onde tem `--primary: ...`).

---

## 🗄️ Passo 4: Criar um Banco de Dados Novo (Supabase)
Cada cliente PRECISA ter o seu próprio banco de dados, para que os agendamentos não se misturem!

1. Acesse o **Supabase** (app.supabase.com) e crie um **New Project** (ex: "Salao Joao BD").
2. Vá no **SQL Editor** deste projeto novo.
3. Copie o conteúdo inteiro do seu arquivo `supabase_schema.sql` (que está na pasta do projeto) e rode lá no Supabase. Isso vai criar as tabelas limpas.
4. Pegue a **URL** e a **Anon Key** desse novo Supabase (em Project Settings -> API).
5. No código do novo projeto, vá no arquivo `src/lib/supabase.ts` e substitua as variáveis `supabaseUrl` e `supabaseKey` pelos valores desse banco de dados novo.

---

## 🌐 Passo 5: Publicar o Novo Site (GitHub + Vercel)
Agora é só colocar o site no ar. Faremos o mesmo processo que usamos com o primeiro projeto.

1. **GitHub:** Abra o GitHub Desktop. Vá em `File -> Add Local Repository` e adicione a pasta nova (`SalaoDoJoao`). Ele vai sugerir de criar um novo repositório, diga que **Sim** (Create a repository).
2. Faça o primeiro "Commit" e clique em **Publish**.
3. **Vercel:** Acesse sua Vercel. Clique em **Add New Project**. Identifique o repositório novo do GitHub (SalaoDoJoao) e clique em **Import**.
4. Clique em **Deploy**! (Se você for usar variáveis de ambiente como fez da última vez, não esqueça de configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas configurações do projeto na Vercel).

---

🎉 **Pronto!** O novo cliente já tem um sistema exclusivo rodando em um link novo `salaodojoao.vercel.app`.
