package br.ucsal.sispront.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "alertas_retriagem")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AlertaRetriagem {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "fila_id", nullable = false)
    private FilaAtendimento fila;
    @Column(name = "tempo_excedido_minutos", nullable = false)
    private Integer tempoExcedidoMinutos;
    @Column(name = "emitido_em", nullable = false, updatable = false)
    private OffsetDateTime emitidoEm;
    @Column(name = "atendido_em")
    private OffsetDateTime atendidoEm;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enfermeiro_responsavel_id")
    private Usuario enfermeiroResponsavel;

    @PrePersist
    protected void onCreate() { this.emitidoEm = OffsetDateTime.now(); }
}
