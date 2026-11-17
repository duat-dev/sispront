package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.AtendimentoPep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;
public interface AtendimentoPepRepository extends JpaRepository<AtendimentoPep, UUID> {
    @Query("SELECT COALESCE(MAX(a.versao), 0) FROM AtendimentoPep a WHERE a.boletim.id = :boletimId")
    Integer findMaxVersaoByBoletimId(@Param("boletimId") UUID boletimId);

    @Query("""
        SELECT a FROM AtendimentoPep a
        JOIN FETCH a.boletim b
        JOIN FETCH b.paciente p
        WHERE p.cpf = :identificador OR p.numeroProntuario = :identificador
        ORDER BY a.dataHora DESC
    """)
    List<AtendimentoPep> buscarHistoricoPorCpfOuProntuario(@Param("identificador") String identificador);
}
