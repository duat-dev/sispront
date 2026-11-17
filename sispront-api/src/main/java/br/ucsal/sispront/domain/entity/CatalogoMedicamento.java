package br.ucsal.sispront.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "catalogo_medicamentos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CatalogoMedicamento {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "principio_ativo", nullable = false, length = 150)
    private String principioAtivo;
    @Column(name = "nome_comercial", nullable = false, length = 150)
    private String nomeComercial;
    @Column(nullable = false, length = 50)
    private String concentracao;
    @Column(name = "forma_farmaceutica", nullable = false, length = 80)
    private String formaFarmaceutica;
    @Column(nullable = false)
    @Builder.Default
    private boolean ativo = true;
}
