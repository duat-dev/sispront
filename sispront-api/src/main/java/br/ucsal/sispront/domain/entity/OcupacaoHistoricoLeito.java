package br.ucsal.sispront.domain.entity;

import br.ucsal.sispront.domain.enums.Enums.EventoLeito;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ocupacoes_historico_leito")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OcupacaoHistoricoLeito {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "leito_id", nullable = false)
    private Leito leito;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boletim_id")
    private BoletimAtendimento boletim;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_responsavel_id", nullable = false)
    private Usuario usuarioResponsavel;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo_evento", nullable = false)
    private EventoLeito tipoEvento;
    private String observacao;
    @Column(name = "data_evento", nullable = false, updatable = false)
    private OffsetDateTime dataEvento;

    @PrePersist
    protected void onCreate() { this.dataEvento = OffsetDateTime.now(); }
}
