package br.ucsal.sispront.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "prescricoes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prescricao {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atendimento_pep_id", nullable = false)
    private AtendimentoPep atendimentoPep;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "medicamento_id", nullable = false)
    private CatalogoMedicamento medicamento;
    @Column(nullable = false, length = 80)
    private String dosagem;
    @Column(name = "via_administracao", nullable = false, length = 50)
    private String viaAdministracao;
    @Column(nullable = false, length = 50)
    private String intervalo;
    private String observacoes;
    @Column(name = "data_emissao", nullable = false, updatable = false)
    private OffsetDateTime dataEmissao;

    @PrePersist
    protected void onCreate() { this.dataEmissao = OffsetDateTime.now(); }
}
