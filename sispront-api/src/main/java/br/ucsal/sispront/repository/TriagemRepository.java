package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.Triagem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface TriagemRepository extends JpaRepository<Triagem, UUID> {
    List<Triagem> findByBoletimIdOrderByDataHoraDesc(UUID boletimId);
}
