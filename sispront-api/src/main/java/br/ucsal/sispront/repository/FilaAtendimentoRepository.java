package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.FilaAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface FilaAtendimentoRepository extends JpaRepository<FilaAtendimento, UUID> {
    List<FilaAtendimento> findByAtivaTrueOrderByPesoPrioridadeAscHoraEntradaFilaAsc();
    Optional<FilaAtendimento> findByBoletimId(UUID boletimId);
}
