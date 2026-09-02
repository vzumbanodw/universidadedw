-- =============================================================================
-- Universidade Dataweb — migração 0013
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- (Requer a migração 0009 — tabela `admin_users` — já executada.)
--
-- Conta de ADMINISTRADORA do backoffice para a Rosa Mantovani
-- (rabeche@dataweb.com.br).
--
-- Funciona nos dois cenários, sem duplicar nada:
--   • a migração 0012 JÁ foi executada  → corrige o nome para "Rosa Mantovani",
--     mantendo o link de ativação que ela já tenha recebido;
--   • a 0012 ainda NÃO foi executada    → cria a conta com um token novo.
--
-- >>> AO RODAR, o resultado exibido é O LINK DE ATIVAÇÃO dela — envie para a
-- >>> Rosa criar a própria senha e entrar no backoffice.
-- =============================================================================

-- Conta já existente: apenas acerta o nome.
update public.admin_users
   set name = 'Rosa Mantovani'
 where lower(email) = 'rabeche@dataweb.com.br';

-- Conta ainda inexistente: cria com token de ativação.
insert into public.admin_users (id, name, email, activation_token)
select 'adm_rosa', 'Rosa Mantovani', 'rabeche@dataweb.com.br',
       encode(gen_random_bytes(24), 'hex')
 where not exists (
   select 1 from public.admin_users where lower(email) = 'rabeche@dataweb.com.br'
 );

-- RESULTADO: o link de ativação da Rosa.
select
  name,
  email,
  case
    when status = 'invited' and activation_token is not null
      then 'https://uni.dataweb.com.br/admin/primeiro-acesso?token=' || activation_token
    else '(conta já ativada — use o login normal)'
  end as link_de_ativacao
from public.admin_users
where lower(email) = 'rabeche@dataweb.com.br';
