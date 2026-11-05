# HoraCerta

**A gestão do tempo da sua empresa.**

Painel administrativo e terminal compartilhado em páginas separadas.

## Estado atual

- Os dados de demonstração e os funcionários fictícios foram removidos.
- As tabelas `hc_*` do Supabase estão criadas e vazias.
- O painel ainda precisa da integração de autenticação e leitura/escrita no Supabase antes de ser usado como sistema de produção.
- O terminal permite testar a câmera, mas ainda não faz reconhecimento facial biométrico nem prova de vida.
- Não utilizar as marcações locais atuais como registros oficiais de jornada ou para folha de pagamento.

## Telas

- Painel administrativo: página inicial.
- Terminal da empresa: `/terminal.html`.

## Próximas etapas obrigatórias para produção real

1. Criar e proteger o primeiro usuário administrador e a empresa.
2. Conectar o painel, cadastro de funcionários, jornadas e relatórios ao Supabase Auth/Postgres com RLS.
3. Implementar autenticação segura do terminal e gravação de marcações no banco, com auditoria e proteção contra duplicidade.
4. Integrar provedor biométrico com prova de vida e controles LGPD.
5. Validar requisitos técnicos e legais aplicáveis ao REP-P antes de oferecer o produto como sistema oficial.

O projeto Supabase reutilizado contém tabelas legadas de outro site. As tabelas antigas foram preservadas; o HoraCerta utiliza apenas o conjunto `hc_*`.
