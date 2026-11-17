package br.ucsal.sispront.domain.entity;

import br.ucsal.sispront.domain.enums.Enums.PerfilUsuario;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(nullable = false, unique = true)
    private String cpf;
    @Column(nullable = false, unique = true, length = 80)
    private String login;
    @JsonIgnore
    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private PerfilUsuario perfil;
    private String crm;
    private String coren;
    @Column(name = "tentativas_falhas", nullable = false)
    private int tentativasFalhas;
    @Column(name = "bloqueado_ate")
    private OffsetDateTime bloqueadoAte;
    @Column(name = "ultimo_acesso")
    private OffsetDateTime ultimoAcesso;
    @Column(nullable = false)
    @Builder.Default
    private boolean ativo = true;
    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @PrePersist
    protected void onCreate() { this.criadoEm = OffsetDateTime.now(); }
}
