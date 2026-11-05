# HoraCerta

**A gestão do tempo da sua empresa.**

Painel administrativo e terminal compartilhado em páginas separadas.

## Estado atual

- Cadastro de conta e login de proprietário via Supabase Auth.
- Cada conta de proprietário pode criar sua própria empresa; o cadastro cria uma jornada padrão.
- Painel administrativo lê e grava funcionários, dados da empresa e marcações no Supabase.
- Terminal consulta funcionários por nome ou matrícula e grava marcações no Supabase.
- As tabelas HoraCerta usam RLS para separar dados por empresa.
- Dados fictícios antigos foram removidos; novas marcações são persistidas na nuvem.

## Como testar

1. Acesse `/conta.html` e crie uma conta com seus dados e os dados da empresa.
2. Se o Supabase solicitar confirmação de e-mail, confirme pelo link enviado e depois entre.
3. No painel, abra **Funcionários → Novo funcionário** e cadastre você mesmo, escolhendo uma matrícula.
4. Abra `/terminal.html` no mesmo navegador em que entrou no painel.
5. Digite sua matrícula, confira a próxima marcação sugerida e confirme.
6. Volte ao painel para conferir a marcação sincronizada.

## Limitações conhecidas do teste

- A câmera pode ser ligada para testar enquadramento, mas ainda não identifica rostos. A identificação é feita por matrícula/nome.
- A captura da câmera não armazena imagem nem cria um modelo biométrico.
- O terminal de teste usa a sessão autenticada do proprietário no mesmo navegador; um tablet separado precisará de ativação segura do dispositivo.
- Assinaturas e cobrança recorrente ainda não estão conectadas.
- O produto ainda não está validado/certificado como REP-P e não deve ser usado como registro oficial de jornada ou folha de pagamento.

## Telas

- Cadastro e login: `/conta.html`
- Painel administrativo: página inicial.
- Terminal da empresa: `/terminal.html`

## Arquitetura

- Supabase Auth para contas de acesso.
- Supabase Postgres para empresas, membros, funcionários, jornadas e marcações.
- Políticas RLS para isolamento entre empresas.
- Vercel para hospedagem.

O projeto Supabase reutilizado contém tabelas legadas de outro site. As tabelas antigas foram preservadas; o HoraCerta utiliza apenas o conjunto `hc_*`.
