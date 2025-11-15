-- Ajustar tamanhos dos campos da tabela cartoes
-- O erro indica que alguns campos estão muito pequenos (varchar(255))

-- Aumentar limite dos campos que podem ter textos longos
ALTER TABLE cartoes
ALTER COLUMN detalhamento TYPE TEXT,
ALTER COLUMN objetivo_atividade TYPE TEXT,
ALTER COLUMN nivel_turma TYPE VARCHAR(100),
ALTER COLUMN publico_alvo TYPE TEXT;

-- Comentários
COMMENT ON COLUMN cartoes.detalhamento IS 'Detalhamento do conteúdo do cartão (pode ser extenso)';
COMMENT ON COLUMN cartoes.objetivo_atividade IS 'Objetivo da atividade (pode ser extenso)';
COMMENT ON COLUMN cartoes.publico_alvo IS 'Público-alvo (pode ter múltiplos cursos)';
