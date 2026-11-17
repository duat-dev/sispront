CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE perfil_usuario_enum AS ENUM (
    'RECEPCIONISTA', 'ENFERMEIRO_TRIAGEM', 'MEDICO_PLANTONISTA', 'GESTOR_LEITOS', 'EQUIPE_HIGIENIZACAO'
);

CREATE TYPE cor_manchester_enum AS ENUM ('VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL');

CREATE TYPE status_atendimento_enum AS ENUM (
    'AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO',
    'AGUARDANDO_LEITO', 'INTERNADO', 'ALTA_CONCEDIDA', 'ALTA_HOSPITALAR'
);

CREATE TYPE desfecho_clinico_enum AS ENUM ('EM_OBSERVACAO', 'ALTA', 'INTERNACAO');

CREATE TYPE status_leito_enum AS ENUM ('LIVRE', 'OCUPADO', 'AGUARDANDO_LIMPEZA', 'EM_LIMPEZA', 'MANUTENCAO');

CREATE TYPE evento_leito_enum AS ENUM (
    'RESERVA_SOLICITADA', 'ALOCACAO', 'TRANSFERENCIA', 'ALTA_REGISTRADA',
    'INICIO_HIGIENIZACAO_SCAN1', 'FIM_HIGIENIZACAO_SCAN2', 'MANUTENCAO_INICIO', 'MANUTENCAO_FIM'
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(255) NOT NULL UNIQUE,
    login VARCHAR(80) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil perfil_usuario_enum NOT NULL,
    crm VARCHAR(25),
    coren VARCHAR(25),
    tentativas_falhas INT NOT NULL DEFAULT 0,
    bloqueado_ate TIMESTAMP WITH TIME ZONE,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    entidade_afetada VARCHAR(80) NOT NULL,
    entidade_id UUID,
    detalhes_json JSONB,
    ip_origem VARCHAR(45),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_prontuario VARCHAR(30) NOT NULL UNIQUE,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F', 'O')),
    nome_mae VARCHAR(150) NOT NULL,
    endereco TEXT NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    cadastrado_por UUID REFERENCES usuarios(id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE boletins_atendimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    recepcionista_id UUID NOT NULL REFERENCES usuarios(id),
    status status_atendimento_enum NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_encerramento TIMESTAMP WITH TIME ZONE
);

CREATE TABLE triagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boletim_id UUID NOT NULL REFERENCES boletins_atendimento(id) ON DELETE CASCADE,
    enfermeiro_id UUID NOT NULL REFERENCES usuarios(id),
    queixa_principal TEXT NOT NULL,
    saturacao_o2 INT NOT NULL CHECK (saturacao_o2 BETWEEN 0 AND 100),
    frequencia_cardiaca INT NOT NULL CHECK (frequencia_cardiaca BETWEEN 20 AND 250),
    pressao_arterial VARCHAR(10) NOT NULL,
    temperatura DECIMAL(4,1) NOT NULL CHECK (temperatura BETWEEN 30.0 AND 45.0),
    glicemia INT CHECK (glicemia >= 0),
    classificacao_sugerida cor_manchester_enum NOT NULL,
    classificacao_final cor_manchester_enum NOT NULL,
    justificativa_sobreposicao TEXT,
    is_retriagem BOOLEAN NOT NULL DEFAULT FALSE,
    sincronizado_offline BOOLEAN NOT NULL DEFAULT FALSE,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fila_atendimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boletim_id UUID NOT NULL UNIQUE REFERENCES boletins_atendimento(id) ON DELETE CASCADE,
    triagem_atual_id UUID NOT NULL REFERENCES triagens(id),
    prioridade_cor cor_manchester_enum NOT NULL,
    peso_prioridade SMALLINT NOT NULL CHECK (peso_prioridade BETWEEN 1 AND 5),
    hora_entrada_fila TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tempo_limite_minutos INT NOT NULL,
    alerta_retriagem_ativo BOOLEAN NOT NULL DEFAULT FALSE,
    ativa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE alertas_retriagem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fila_id UUID NOT NULL REFERENCES fila_atendimento(id) ON DELETE CASCADE,
    tempo_excedido_minutos INT NOT NULL,
    emitido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atendido_em TIMESTAMP WITH TIME ZONE,
    enfermeiro_responsavel_id UUID REFERENCES usuarios(id)
);

CREATE TABLE atendimentos_pep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boletim_id UUID NOT NULL REFERENCES boletins_atendimento(id) ON DELETE RESTRICT,
    medico_id UUID NOT NULL REFERENCES usuarios(id),
    versao INT NOT NULL DEFAULT 1,
    anamnese TEXT NOT NULL,
    exame_fisico TEXT NOT NULL,
    hipoteses_diagnosticas_cid10 VARCHAR(15)[] NOT NULL,
    evolucao_clinica TEXT NOT NULL,
    desfecho desfecho_clinico_enum NOT NULL DEFAULT 'EM_OBSERVACAO',
    sumario_alta TEXT,
    sincronizado_offline BOOLEAN NOT NULL DEFAULT FALSE,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_boletim_versao_pep UNIQUE (boletim_id, versao)
);

CREATE TABLE catalogo_medicamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principio_ativo VARCHAR(150) NOT NULL,
    nome_comercial VARCHAR(150) NOT NULL,
    concentracao VARCHAR(50) NOT NULL,
    forma_farmaceutica VARCHAR(80) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE prescricoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendimento_pep_id UUID NOT NULL REFERENCES atendimentos_pep(id) ON DELETE RESTRICT,
    medicamento_id UUID NOT NULL REFERENCES catalogo_medicamentos(id),
    dosagem VARCHAR(80) NOT NULL,
    via_administracao VARCHAR(50) NOT NULL,
    intervalo VARCHAR(50) NOT NULL,
    observacoes TEXT,
    data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leitos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(20) NOT NULL UNIQUE,
    ala_setor VARCHAR(80) NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    sexo_compativel CHAR(1) NOT NULL DEFAULT 'A' CHECK (sexo_compativel IN ('M', 'F', 'A')),
    status status_leito_enum NOT NULL DEFAULT 'LIVRE',
    motivo_manutencao TEXT,
    qr_code_hash VARCHAR(128) NOT NULL UNIQUE,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ocupacoes_historico_leito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leito_id UUID NOT NULL REFERENCES leitos(id) ON DELETE RESTRICT,
    boletim_id UUID REFERENCES boletins_atendimento(id),
    usuario_responsavel_id UUID NOT NULL REFERENCES usuarios(id),
    tipo_evento evento_leito_enum NOT NULL,
    observacao TEXT,
    data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
