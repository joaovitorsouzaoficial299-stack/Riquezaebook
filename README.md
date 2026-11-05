# HoraCerta

**A gestão do tempo da sua empresa.**

Primeira versão navegável do SaaS de gestão de jornada e frequência.

## O que já pode ser testado
- Dashboard administrativo com indicadores e acompanhamento da equipe.
- Cadastro local de funcionários e matrículas de demonstração.
- Terminal com ativação da câmera do dispositivo via `getUserMedia`.
- Fluxo de identificação **simulada**, sugestão da próxima marcação e confirmação.
- Registro de entradas, saídas e intervalos no navegador.
- Portal do funcionário por matrícula.
- Consulta de marcações e exportação CSV demonstrativa.
- Layout responsivo para desktop, tablet e celular.

## Acessos de demonstração
- Admin: abra a página inicial.
- Terminal: menu lateral > Terminal facial. Ative a câmera e selecione um funcionário para simular a identificação.
- Portal: menu lateral > Portal do funcionário. Matrículas: `HC-1001`, `HC-1002`, `HC-1003`.

## Limitações importantes desta versão
- Os dados são armazenados no `localStorage` do navegador. Não há banco compartilhado, autenticação real nem isolamento entre empresas.
- A câmera é acessada para testar permissão e vídeo. **Não há reconhecimento facial biométrico nem prova de vida** nesta versão. A seleção do funcionário simula a identificação, sem capturar ou armazenar biometria.
- Marcações são demonstrativas e não constituem registros oficiais de ponto. Este protótipo não está validado como REP-P e não gera AFD/AEJ ou comprovantes oficiais.
- Jornadas, saldos, indicadores e relatórios ainda são dados ilustrativos. Não utilizar para folha de pagamento ou decisões trabalhistas.
- A Cakto está prevista para uma etapa futura. Nenhuma cobrança ou assinatura está ativa.

## Publicação
Projeto estático compatível com Vercel. Para testar a câmera, abra o site por HTTPS (a URL da Vercel já usa HTTPS) e autorize o acesso à câmera no navegador. Em desenvolvimento local, use localhost.

## Próximas integrações
1. Supabase Auth e PostgreSQL com isolamento multiempresa e políticas RLS.
2. Provedor de reconhecimento facial com prova de vida, tratamento LGPD e fluxo alternativo auditável.
3. Motor de jornada e regras trabalhistas versionadas.
4. Requisitos técnicos e legais do REP-P conforme regulamentação vigente.
5. Cakto para planos, pagamentos e assinaturas, com webhooks e validação no servidor.

Não colocar chaves secretas, service role ou credenciais privadas no frontend.
