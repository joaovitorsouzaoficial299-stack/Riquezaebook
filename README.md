# Doces da Gi

Loja virtual responsiva de doces e biscoitos com catálogo, estoque, preços promocionais, carrinho e pedidos pelo WhatsApp.

## Tecnologias
- HTML, CSS e JavaScript
- Supabase Auth, Database e Storage
- Vercel para hospedagem

## Configuração necessária
1. O banco Supabase já foi criado na organização AL PACINO.
2. Crie a conta de login da administradora no Supabase Auth.
3. Adicione o UUID dessa conta à tabela public.admins (veja o SQL de configuração no arquivo supabase-setup.sql).
4. Configure o número comercial da loja em VITE_WHATSAPP_NUMBER nas variáveis do projeto Vercel, usando apenas números com DDI e DDD (ex.: 5511999999999).
5. Cadastre produtos, fotos, preço atual, preço original e estoque no painel /admin.

O site não processa pagamentos. O pedido é montado e enviado para o WhatsApp para combinar pagamento e entrega/retirada. O estoque exibido não é reservado automaticamente; a administradora deve atualizá-lo conforme os pedidos confirmados.

A chave publishable do Supabase é pública por definição. Nunca adicione uma chave service_role ou segredo no frontend.
