package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.OcupacaoHistoricoLeito;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface OcupacaoHistoricoLeitoRepository extends JpaRepository<OcupacaoHistoricoLeito, UUID> {
    Optional<OcupacaoHistoricoLeito> findFirstByBoletimIdOrderByDataEventoDesc(UUID boletimId);
}
