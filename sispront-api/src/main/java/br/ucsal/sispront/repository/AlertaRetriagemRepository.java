package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.AlertaRetriagem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface AlertaRetriagemRepository extends JpaRepository<AlertaRetriagem, UUID> {
    List<AlertaRetriagem> findByAtendidoEmIsNullOrderByEmitidoEmAsc();
}
