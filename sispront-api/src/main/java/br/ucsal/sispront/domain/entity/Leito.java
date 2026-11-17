package br.ucsal.sispront.domain.entity;

import br.ucsal.sispront.domain.enums.Enums.StatusLeito;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "leitos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Leito {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, unique = true, length = 20)
    private String numero;
    @Column(name = "ala_setor", nullable = false, length = 80)
    private String alaSetor;
    @Column(nullable = false, length = 100)
    private String especialidade;
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "sexo_compativel", nullable = false, length = 1)
    private String sexoCompativel;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private StatusLeito status;
    @Column(name = "motivo_manutencao")
    private String motivoManutencao;
    @Column(name = "qr_code_hash", nullable = false, unique = true, length = 128)
    private String qrCodeHash;
    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;

    @PrePersist
    @PreUpdate
    protected void onTouch() {
        this.atualizadoEm = OffsetDateTime.now();
        if (this.status == null) this.status = StatusLeito.LIVRE;
    }
}
