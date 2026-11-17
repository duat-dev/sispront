package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.Leito;
import br.ucsal.sispront.domain.enums.Enums.StatusLeito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface LeitoRepository extends JpaRepository<Leito, UUID> {
    Optional<Leito> findByQrCodeHash(String qrCodeHash);

    @Query("""
        SELECT l FROM Leito l
        WHERE l.status = :status
        AND LOWER(l.especialidade) = LOWER(:especialidade)
        AND (l.sexoCompativel = 'A' OR l.sexoCompativel = :sexo)
    """)
    List<Leito> buscarLeitosCompativeis(
            @Param("status") StatusLeito status,
            @Param("especialidade") String especialidade,
            @Param("sexo") String sexo
    );
}
