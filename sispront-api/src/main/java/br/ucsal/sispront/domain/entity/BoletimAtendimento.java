package br.ucsal.sispront.domain.entity;

import br.ucsal.sispront.domain.enums.Enums.StatusAtendimento;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "boletins_atendimento")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BoletimAtendimento {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recepcionista_id", nullable = false)
    private Usuario recepcionista;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private StatusAtendimento status;
    @Column(name = "data_abertura", nullable = false, updatable = false)
    private OffsetDateTime dataAbertura;
    @Column(name = "data_encerramento")
    private OffsetDateTime dataEncerramento;

    @PrePersist
    protected void onCreate() {
        this.dataAbertura = OffsetDateTime.now();
        if (this.status == null) this.status = StatusAtendimento.AGUARDANDO_TRIAGEM;
    }
}
