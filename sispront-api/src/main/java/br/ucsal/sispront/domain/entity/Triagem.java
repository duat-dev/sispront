package br.ucsal.sispront.domain.entity;

import br.ucsal.sispront.domain.enums.Enums.CorManchester;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "triagens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Triagem {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "boletim_id", nullable = false)
    private BoletimAtendimento boletim;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enfermeiro_id", nullable = false)
    private Usuario enfermeiro;
    @Column(name = "queixa_principal", nullable = false)
    private String queixaPrincipal;
    @Column(name = "saturacao_o2", nullable = false)
    private Integer saturacaoO2;
    @Column(name = "frequencia_cardiaca", nullable = false)
    private Integer frequenciaCardiaca;
    @Column(name = "pressao_arterial", nullable = false, length = 10)
    private String pressaoArterial;
    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal temperatura;
    private Integer glicemia;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "classificacao_sugerida", nullable = false)
    private CorManchester classificacaoSugerida;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "classificacao_final", nullable = false)
    private CorManchester classificacaoFinal;
    @Column(name = "justificativa_sobreposicao")
    private String justificativaSobreposicao;
    @Column(name = "is_retriagem", nullable = false)
    private boolean isRetriagem;
    @Column(name = "sincronizado_offline", nullable = false)
    private boolean sincronizadoOffline;
    @Column(name = "data_hora", nullable = false, updatable = false)
    private OffsetDateTime dataHora;

    @PrePersist
    protected void onCreate() { this.dataHora = OffsetDateTime.now(); }
}
