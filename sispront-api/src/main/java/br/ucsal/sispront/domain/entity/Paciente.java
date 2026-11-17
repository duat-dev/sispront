package br.ucsal.sispront.domain.entity;

import br.ucsal.sispront.util.AesCryptoConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "pacientes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Paciente {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "numero_prontuario", nullable = false, unique = true, length = 30)
    private String numeroProntuario;
    @Column(nullable = false, unique = true, length = 11)
    private String cpf;
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(name = "data_nascimento", nullable = false)
    private LocalDate dataNascimento;
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, length = 1)
    private String sexo;
    @Column(name = "nome_mae", nullable = false, length = 150)
    private String nomeMae;
    @Convert(converter = AesCryptoConverter.class)
    @Column(nullable = false)
    private String endereco;
    @Column(nullable = false, length = 20)
    private String telefone;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cadastrado_por")
    private Usuario cadastradoPor;
    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;
    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;

    @PrePersist
    protected void onCreate() {
        this.criadoEm = OffsetDateTime.now();
        this.atualizadoEm = OffsetDateTime.now();
    }
    @PreUpdate
    protected void onUpdate() { this.atualizadoEm = OffsetDateTime.now(); }
}
