package br.ucsal.sispront.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

public class Enums {
    public enum PerfilUsuario {
        RECEPCIONISTA, ENFERMEIRO_TRIAGEM, MEDICO_PLANTONISTA, GESTOR_LEITOS, EQUIPE_HIGIENIZACAO
    }

    @Getter
    @RequiredArgsConstructor
    public enum CorManchester {
        VERMELHO((short) 1, 0),
        LARANJA((short) 2, 10),
        AMARELO((short) 3, 60),
        VERDE((short) 4, 120),
        AZUL((short) 5, 240);

        private final short peso;
        private final int tempoLimiteMinutos;
    }

    public enum StatusAtendimento {
        AGUARDANDO_TRIAGEM, EM_TRIAGEM, AGUARDANDO_ATENDIMENTO, EM_ATENDIMENTO,
        AGUARDANDO_LEITO, INTERNADO, ALTA_CONCEDIDA, ALTA_HOSPITALAR
    }

    public enum DesfechoClinico {
        EM_OBSERVACAO, ALTA, INTERNACAO
    }

    public enum StatusLeito {
        LIVRE, OCUPADO, AGUARDANDO_LIMPEZA, EM_LIMPEZA, MANUTENCAO
    }

    public enum EventoLeito {
        RESERVA_SOLICITADA, ALOCACAO, TRANSFERENCIA, ALTA_REGISTRADA,
        INICIO_HIGIENIZACAO_SCAN1, FIM_HIGIENIZACAO_SCAN2, MANUTENCAO_INICIO, MANUTENCAO_FIM
    }
}
