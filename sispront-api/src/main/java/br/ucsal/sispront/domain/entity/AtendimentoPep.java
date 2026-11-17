package br.ucsal.sispront.domain.entity;

import br.ucsal.sispront.domain.enums.Enums.DesfechoClinico;
import br.ucsal.sispront.util.AesCryptoConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Immutable
@Table(name = "atendimentos_pep")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AtendimentoPep {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "boletim_id", nullable = false)
    private BoletimAtendimento boletim;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Usuario medico;
    @Column(nullable = false)
    private Integer versao;
    @Convert(converter = AesCryptoConverter.class)
    @Column(nullable = false)
    private String anamnese;
    @Convert(converter = AesCryptoConverter.class)
    @Column(name = "exame_fisico", nullable = false)
    private String exameFisico;
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "hipoteses_diagnosticas_cid10", nullable = false, columnDefinition = "varchar(15)[]")
    private List<String> hipotesesDiagnosticasCid10;
    @Convert(converter = AesCryptoConverter.class)
    @Column(name = "evolucao_clinica", nullable = false)
    private String evolucaoClinica;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private DesfechoClinico desfecho;
    @Convert(converter = AesCryptoConverter.class)
    @Column(name = "sumario_alta")
    private String sumarioAlta;
    @Column(name = "sincronizado_offline", nullable = false)
    private boolean sincronizadoOffline;
    @Column(name = "data_hora", nullable = false, updatable = false)
    private OffsetDateTime dataHora;

    @PrePersist
    protected void onCreate() { this.dataHora = OffsetDateTime.now(); }
}
