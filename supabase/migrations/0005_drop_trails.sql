-- =============================================================================
-- Universidade Dataweb — migração 0005
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--
-- Remove o conceito de TRILHAS. O modelo passa a ser:
--   Aplicações  →  Cursos  →  Aulas
-- As tabelas de trilhas não são mais usadas pelo app.
-- =============================================================================

drop table if exists public.trail_courses cascade;
drop table if exists public.learning_trails cascade;
