-- =============================================================================
-- Universidade Dataweb — migração 0014
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- DIAGNÓSTICO + DESBLOQUEIO de uma conta de administrador do backoffice.
-- Use quando alguém diz "sou admin mas não consigo entrar".
--
-- O primeiro SELECT mostra o estado REAL da conta:
--   status         invited = nunca definiu senha | active = senha definida
--   tem_senha      false   = não consegue fazer login (é a causa mais comum)
--   tem_link       true    = existe um link de senha pendente
--
-- O UPDATE gera um LINK NOVO de senha (o anterior deixa de valer) sem apagar
-- a conta, o nome nem o histórico de ações da pessoa.
--
-- >>> EDITE o e-mail nas três consultas abaixo se for outra pessoa. <<<
-- =============================================================================

-- 1) Como está a conta hoje
select
  name,
  email,
  status,
  (password_hash is not null) as tem_senha,
  (activation_token is not null) as tem_link,
  created_at
from public.admin_users
where lower(email) = 'rabeche@dataweb.com.br';

-- 2) Gera um link novo de senha (mantém a conta; invalida links anteriores)
update public.admin_users
   set activation_token = encode(gen_random_bytes(24), 'hex')
 where lower(email) = 'rabeche@dataweb.com.br';

-- 3) RESULTADO: o link para enviar à pessoa
select
  name,
  email,
  'https://uni.dataweb.com.br/admin/primeiro-acesso?token=' || activation_token
    as link_de_senha
from public.admin_users
where lower(email) = 'rabeche@dataweb.com.br';
