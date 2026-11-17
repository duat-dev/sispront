package br.ucsal.sispront.domain.entity;

import br.ucsal.sispront.domain.enums.Enums.CorManchester;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "fila_atendimento")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FilaAtendimento {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "boletim_id", nullable = false, unique = true)
    private BoletimAtendimento boletim;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "triagem_atual_id", nullable = false)
    private Triagem triagemAtual;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "prioridade_cor", nullable = false)
    private CorManchester prioridadeCor;
    @Column(name = "peso_prioridade", nullable = false)
    private Short pesoPrioridade;
    @Column(name = "hora_entrada_fila", nullable = false)
    private OffsetDateTime horaEntradaFila;
    @Column(name = "tempo_limite_minutos", nullable = false)
    private Integer tempoLimiteMinutos;
    @Column(name = "alerta_retriagem_ativo", nullable = false)
    private boolean alertaRetriagemAtivo;
    @Column(nullable = false)
    @Builder.Default
    private boolean ativa = true;

    @PrePersist
    protected void onCreate() {
        if (this.horaEntradaFila == null) this.horaEntradaFila = OffsetDateTime.now();
    }
}
