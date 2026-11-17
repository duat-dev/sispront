package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.CatalogoMedicamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;
public interface CatalogoMedicamentoRepository extends JpaRepository<CatalogoMedicamento, UUID> {
    @Query("""
        SELECT m FROM CatalogoMedicamento m
        WHERE m.ativo = true
        AND (LOWER(m.principioAtivo) LIKE LOWER(CONCAT('%', :termo, '%'))
             OR LOWER(m.nomeComercial) LIKE LOWER(CONCAT('%', :termo, '%')))
    """)
    List<CatalogoMedicamento> buscarAutocomplete(@Param("termo") String termo);
}
