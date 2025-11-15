-- Adicionar campos extras na tabela unidades_curriculares
ALTER TABLE unidades_curriculares
ADD COLUMN IF NOT EXISTS periodo_letivo TEXT,
ADD COLUMN IF NOT EXISTS carga_horaria TEXT,
ADD COLUMN IF NOT EXISTS cursos TEXT[],
ADD COLUMN IF NOT EXISTS topicos_geradores TEXT[],
ADD COLUMN IF NOT EXISTS metas_compreensao TEXT[],
ADD COLUMN IF NOT EXISTS desempenho_compreensao TEXT,
ADD COLUMN IF NOT EXISTS ementa TEXT,
ADD COLUMN IF NOT EXISTS certificacao TEXT,
ADD COLUMN IF NOT EXISTS competencias TEXT[],
ADD COLUMN IF NOT EXISTS bibliografia_basica TEXT[],
ADD COLUMN IF NOT EXISTS bibliografia_complementar TEXT[],
ADD COLUMN IF NOT EXISTS conteudo_programatico TEXT;

-- Adicionar índices para busca
CREATE INDEX IF NOT EXISTS idx_uc_periodo ON unidades_curriculares(periodo_letivo);
CREATE INDEX IF NOT EXISTS idx_uc_titulo ON unidades_curriculares USING gin(to_tsvector('portuguese', titulo));

-- Comentários nas colunas
COMMENT ON COLUMN unidades_curriculares.periodo_letivo IS 'Período letivo (ex: 2025/1)';
COMMENT ON COLUMN unidades_curriculares.carga_horaria IS 'Carga horária total (ex: 160h)';
COMMENT ON COLUMN unidades_curriculares.cursos IS 'Lista de cursos que utilizam esta UC';
COMMENT ON COLUMN unidades_curriculares.topicos_geradores IS 'Tópicos geradores da UC (base para UAs)';
COMMENT ON COLUMN unidades_curriculares.metas_compreensao IS 'Metas de compreensão da UC';
COMMENT ON COLUMN unidades_curriculares.desempenho_compreensao IS 'Descrição dos desempenhos de compreensão';
COMMENT ON COLUMN unidades_curriculares.ementa IS 'Ementa completa da UC';
COMMENT ON COLUMN unidades_curriculares.certificacao IS 'Certificação oferecida';
COMMENT ON COLUMN unidades_curriculares.competencias IS 'Lista de competências desenvolvidas';
COMMENT ON COLUMN unidades_curriculares.bibliografia_basica IS 'Bibliografia básica obrigatória';
COMMENT ON COLUMN unidades_curriculares.bibliografia_complementar IS 'Bibliografia complementar';
COMMENT ON COLUMN unidades_curriculares.conteudo_programatico IS 'Conteúdo programático detalhado';
