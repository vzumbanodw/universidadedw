-- =============================================================================
-- Universidade Dataweb — migração 0010
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- Remove a conta de administrador da Mariana (mcoser@dataweb.com.br) do
-- backoffice. Necessária somente se a migração 0009 foi executada ANTES desta
-- mudança (a 0009 atual já não cria a conta dela) — rodar sem a conta existir
-- é inofensivo.
--
-- As responsabilidades passam para a Evellyn (eiglesias@dataweb.com.br):
-- os avisos de novas solicitações e o remetente dos e-mails da plataforma
-- (variável MAIL_FROM) agora usam o e-mail dela.
--
-- O histórico de ações já registradas pela Mariana é PRESERVADO — é um
-- registro do que aconteceu, não uma permissão.
-- =============================================================================

delete from public.admin_users
where id = 'adm_mariana' or lower(email) = 'mcoser@dataweb.com.br';

-- Confirmação: contas de administrador restantes.
select name, email, status from public.admin_users order by name;
