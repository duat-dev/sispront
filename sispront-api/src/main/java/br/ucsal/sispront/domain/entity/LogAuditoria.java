package br.ucsal.sispront.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "logs_auditoria")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LogAuditoria {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    @Column(nullable = false, length = 100)
    private String acao;
    @Column(name = "entidade_afetada", nullable = false, length = 80)
    private String entidadeAfetada;
    @Column(name = "entidade_id")
    private UUID entidadeId;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detalhes_json", columnDefinition = "jsonb")
    private Map<String, Object> detalhesJson;
    @Column(name = "ip_origem", length = 45)
    private String ipOrigem;
    @Column(name = "data_hora", nullable = false, updatable = false)
    private OffsetDateTime dataHora;

    @PrePersist
    protected void onCreate() { this.dataHora = OffsetDateTime.now(); }
}
