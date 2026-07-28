-- =============================================================================
-- Universidade Dataweb — migração 0008
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Rode ANTES de publicar a versão do app com o novo fluxo de acesso.
--
-- 1) `access_requests.cnpj` — CNPJ da empresa informado pelo solicitante no
--    formulário público "Solicitar acesso ao sistema" (armazenado formatado,
--    ex.: 12.345.678/0001-90).
--
-- 2) Tokens de ativação (`activation_token`) — o novo fluxo de senha:
--    a aprovação (de acesso OU de redefinição) gera um token aleatório que é
--    enviado por e-mail ao solicitante como um link pessoal
--    (/primeiro-acesso?token=...). A página só deixa criar a senha com um
--    token válido — não existe mais entrada por e-mail digitado.
-- =============================================================================

alter table public.access_requests
  add column if not exists cnpj text,
  add column if not exists activation_token text;

alter table public.password_reset_requests
  add column if not exists activation_token text;

create index if not exists access_requests_activation_token_idx
  on public.access_requests (activation_token);

create index if not exists password_reset_requests_activation_token_idx
  on public.password_reset_requests (activation_token);
