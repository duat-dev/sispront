package br.ucsal.sispront.controller;

import br.ucsal.sispront.domain.entity.BoletimAtendimento;
import br.ucsal.sispront.domain.entity.Paciente;
import br.ucsal.sispront.domain.entity.Usuario;
import br.ucsal.sispront.domain.enums.Enums.StatusAtendimento;
import br.ucsal.sispront.repository.BoletimAtendimentoRepository;
import br.ucsal.sispront.repository.PacienteRepository;
import br.ucsal.sispront.util.CpfValidator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pacientes")
@RequiredArgsConstructor
public class PacienteController {
    private final PacienteRepository pacienteRepository;
    private final BoletimAtendimentoRepository boletimRepository;

    public record PacienteRequest(
            @NotBlank String cpf, @NotBlank String nome, @NotNull LocalDate dataNascimento,
            @NotBlank String sexo, @NotBlank String nomeMae, @NotBlank String endereco, @NotBlank String telefone
    ) {}

    @GetMapping
    public List<Paciente> listarTodos() { return pacienteRepository.findAll(); }

    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<Paciente> consultarPorCpf(@PathVariable String cpf) {
        String cpfLimpo = cpf.replaceAll("\\D", "");
        if (!CpfValidator.isValid(cpfLimpo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF inválido (RF01)");
        }
        return pacienteRepository.findByCpf(cpfLimpo).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Paciente> cadastrarOuAtualizarPorCpf(
            @Valid @RequestBody PacienteRequest req, @AuthenticationPrincipal Usuario usuarioLogado) {
        String cpfLimpo = req.cpf().replaceAll("\\D", "");
        if (!CpfValidator.isValid(cpfLimpo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF matematicamente inválido (RF01)");
        }
        return pacienteRepository.findByCpf(cpfLimpo)
                .map(existente -> {
                    existente.setNome(req.nome());
                    existente.setDataNascimento(req.dataNascimento());
                    existente.setSexo(req.sexo());
                    existente.setNomeMae(req.nomeMae());
                    existente.setEndereco(req.endereco());
                    existente.setTelefone(req.telefone());
                    return ResponseEntity.ok(pacienteRepository.save(existente));
                })
                .orElseGet(() -> {
                    String prontuario = "PRT-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    Paciente novo = Paciente.builder()
                            .numeroProntuario(prontuario).cpf(cpfLimpo).nome(req.nome())
                            .dataNascimento(req.dataNascimento()).sexo(req.sexo()).nomeMae(req.nomeMae())
                            .endereco(req.endereco()).telefone(req.telefone()).cadastradoPor(usuarioLogado).build();
                    return ResponseEntity.status(HttpStatus.CREATED).body(pacienteRepository.save(novo));
                });
    }

    @PostMapping("/{id}/disponibilizar-triagem")
    public ResponseEntity<BoletimAtendimento> disponibilizarParaTriagem(
            @PathVariable UUID id, @AuthenticationPrincipal Usuario recepcionista) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente não encontrado"));
        BoletimAtendimento boletim = BoletimAtendimento.builder()
                .paciente(paciente).recepcionista(recepcionista).status(StatusAtendimento.AGUARDANDO_TRIAGEM).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(boletimRepository.save(boletim));
    }
}
