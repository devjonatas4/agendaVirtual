# Como rodar a agenda no seu computador (sem o Lovable)

Tudo roda na sua máquina: o site e o banco de dados.

## 1. Instale 2 programas (uma vez só)

1. **Bun** — https://bun.sh
   - Mac/Linux: `curl -fsSL https://bun.sh/install | bash`
   - Windows (PowerShell): `powershell -c "irm bun.sh/install.ps1 | iex"`
2. **Docker Desktop** — https://www.docker.com/products/docker-desktop
   Abra o Docker e deixe ele ligado (o banco de dados roda dentro dele).

## 2. Ligue o banco de dados

Abra o terminal dentro desta pasta e rode:

```
bun install
bunx supabase start
```

Na primeira vez demora alguns minutos (baixa o banco). No final aparece uma lista.
Se o `bunx supabase` não funcionar, instale o Supabase CLI: Mac `brew install supabase/tap/supabase`, Windows `scoop install supabase` — e use `supabase start` no lugar.

Copie o valor de **Publishable key** (em versões antigas aparece como **anon key**).

As tabelas da agenda são criadas sozinhas (pasta `supabase/migrations`).

## 3. Cole a chave

Abra o arquivo `.env` e troque `COLE_A_CHAVE_AQUI` pela chave copiada (nos 2 lugares).

## 4. Abra o app

```
bun dev
```

Abra **http://localhost:8080** no navegador.

## 5. Teste

1. Vá em **http://localhost:8080/auth** e crie a primeira conta com **e-mail e senha**.
   A primeira conta vira a administradora (a Jessica). No computador não precisa confirmar e-mail.
2. Em **Minha página**, preencha o WhatsApp e as redes sociais.
3. Volte ao início: o botão do WhatsApp abre a conversa com a mensagem pronta.
4. Em **Agenda**, crie uma pré-reserva, confirme o pagamento e use os botões de WhatsApp.
5. Para testar a banda: saia, crie outra conta, entre de novo como administradora
   e libere essa pessoa em **Equipe**.

Ver o banco por dentro: **http://127.0.0.1:54323** (painel do Supabase local).

Testes automáticos das regras: `bun run test`

## Avisos

- O botão **"Continuar com Google"** não funciona no computador. Use e-mail e senha.
- Para desligar o banco: `bunx supabase stop`. Os dados ficam guardados para a próxima vez.
- Apagar tudo e começar do zero: `bunx supabase db reset`.
