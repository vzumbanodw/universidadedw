-- =============================================================================
-- Universidade Dataweb — migração 0012
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- (Requer a migração 0009 — tabela `admin_users` — já executada.)
--
-- Novas contas de ADMINISTRADOR do backoffice (2º lote), cada uma com token
-- de ativação pessoal:
--
--   Rosa Abeche           rabeche@dataweb.com.br
--   Isabel Silva          isilva@dataweb.com.br
--   Carla Jacintho        cjacintho@dataweb.com.br
--   Caroline Schauenberg  cschauenberg@dataweb.com.br
--
-- >>> AO RODAR, o resultado exibido são OS 4 LINKS DE ATIVAÇÃO — copie e
-- >>> envie para cada pessoa criar a própria senha e entrar no backoffice.
--
-- Rodar de novo não duplica contas nem regenera tokens já criados.
-- =============================================================================

insert into public.admin_users (id, name, email, activation_token)
values
  ('adm_rosa',     'Rosa Abeche',          'rabeche@dataweb.com.br',      encode(gen_random_bytes(24), 'hex')),
  ('adm_isabel',   'Isabel Silva',         'isilva@dataweb.com.br',       encode(gen_random_bytes(24), 'hex')),
  ('adm_carla',    'Carla Jacintho',       'cjacintho@dataweb.com.br',   encode(gen_random_bytes(24), 'hex')),
  ('adm_caroline', 'Caroline Schauenberg', 'cschauenberg@dataweb.com.br', encode(gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

-- RESULTADO: os links de ativação para enviar a cada pessoa.
select
  name,
  email,
  case
    when status = 'invited' and activation_token is not null
      then 'https://uni.dataweb.com.br/admin/primeiro-acesso?token=' || activation_token
    else '(conta já ativada — use o login normal)'
  end as link_de_ativacao
from public.admin_users
where id in ('adm_rosa', 'adm_isabel', 'adm_carla', 'adm_caroline')
order by name;
