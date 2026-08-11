-- =============================================================================
-- Universidade Dataweb — migração 0011
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- (Requer a migração 0009 — tabela `admin_users` — já executada.)
--
-- Cria a conta de ADMINISTRADOR do backoffice para o Victor
-- (vzumbano@dataweb.com.br), com token de ativação.
--
-- >>> AO RODAR, o resultado exibido é O LINK DE ATIVAÇÃO da conta — abra o
-- >>> link para definir a sua senha e entrar no backoffice.
--
-- Rodar de novo não duplica nem regenera um token já criado.
-- =============================================================================

insert into public.admin_users (id, name, email, activation_token)
values
  ('adm_victor', 'Victor', 'vzumbano@dataweb.com.br', encode(gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

-- RESULTADO: o link de ativação da conta do Victor.
select
  name,
  email,
  case
    when status = 'invited' and activation_token is not null
      then 'https://uni.dataweb.com.br/admin/primeiro-acesso?token=' || activation_token
    else '(conta já ativada — use o login normal)'
  end as link_de_ativacao
from public.admin_users
where id = 'adm_victor';
