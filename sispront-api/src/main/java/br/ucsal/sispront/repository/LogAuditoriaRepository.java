package br.ucsal.sispront.repository;
import br.ucsal.sispront.domain.entity.LogAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, UUID> {}
