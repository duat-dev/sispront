package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface PacienteRepository extends JpaRepository<Paciente, UUID> {
    Optional<Paciente> findByCpf(String cpf);
    Optional<Paciente> findByNumeroProntuario(String numeroProntuario);
}
