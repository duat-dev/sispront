package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.Prescricao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface PrescricaoRepository extends JpaRepository<Prescricao, UUID> {
    List<Prescricao> findByAtendimentoPepId(UUID atendimentoPepId);
}
