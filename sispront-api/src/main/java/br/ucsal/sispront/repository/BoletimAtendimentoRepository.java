package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.BoletimAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface BoletimAtendimentoRepository extends JpaRepository<BoletimAtendimento, UUID> {
    List<BoletimAtendimento> findByPacienteIdOrderByDataAberturaDesc(UUID pacienteId);
}
