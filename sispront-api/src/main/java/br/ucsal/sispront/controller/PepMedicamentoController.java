package br.ucsal.sispront.controller;

import br.ucsal.sispront.domain.entity.*;
import br.ucsal.sispront.domain.enums.Enums.*;
import br.ucsal.sispront.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PepMedicamentoController {
    private final AtendimentoPepRepository pepRepository;
    private final BoletimAtendimentoRepository boletimRepository;
    private final CatalogoMedicamentoRepository medicamentoRepository;
    private final PrescricaoRepository prescricaoRepository;
    private final OcupacaoHistoricoLeitoRepository historicoLeitoRepository;
    private final LeitoRepository leitoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public record PepRequest(
            @NotNull UUID boletimId, @NotBlank String anamnese, @NotBlank String exameFisico,
            @NotEmpty List<String> hipotesesDiagnosticasCid10, @NotBlank String evolucaoClinica,
            @NotNull DesfechoClinico desfecho, String sumarioAlta, boolean sincronizadoOffline
    ) {}

    public record PrescricaoRequest(
            @NotNull UUID medicamentoId, @NotBlank String dosagem,
            @NotBlank String viaAdministracao, @NotBlank String intervalo, String observacoes
    ) {}

    @PostMapping("/pep/atendimentos")
    @Transactional
    public ResponseEntity<AtendimentoPep> registrarAtendimentoPep(
            @Valid @RequestBody PepRequest req, @AuthenticationPrincipal Usuario medico) {
        if (req.desfecho() == DesfechoClinico.ALTA && (req.sumarioAlta() == null || req.sumarioAlta().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sumário de alta é obrigatório (RF10)");
        }
        BoletimAtendimento boletim = boletimRepository.findById(req.boletimId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Boletim não encontrado"));
        int novaVersao = pepRepository.findMaxVersaoByBoletimId(boletim.getId()) + 1;

        AtendimentoPep pep = pepRepository.save(AtendimentoPep.builder()
                .boletim(boletim).medico(medico).versao(novaVersao).anamnese(req.anamnese())
                .exameFisico(req.exameFisico()).hipotesesDiagnosticasCid10(req.hipotesesDiagnosticasCid10())
                .evolucaoClinica(req.evolucaoClinica()).desfecho(req.desfecho())
                .sumarioAlta(req.sumarioAlta()).sincronizadoOffline(req.sincronizadoOffline()).build());

        if (req.desfecho() == DesfechoClinico.ALTA) {
            boletim.setStatus(StatusAtendimento.ALTA_HOSPITALAR);
            boletim.setDataEncerramento(OffsetDateTime.now());
            boletimRepository.save(boletim);
            historicoLeitoRepository.findFirstByBoletimIdOrderByDataEventoDesc(boletim.getId())
                    .ifPresent(ocupacao -> {
                        Leito leito = ocupacao.getLeito();
                        if (leito.getStatus() == StatusLeito.OCUPADO) {
                            leito.setStatus(StatusLeito.AGUARDANDO_LIMPEZA);
                            leitoRepository.save(leito);
                            historicoLeitoRepository.save(OcupacaoHistoricoLeito.builder()
                                    .leito(leito).boletim(boletim).usuarioResponsavel(medico)
                                    .tipoEvento(EventoLeito.ALTA_REGISTRADA).build());
                            messagingTemplate.convertAndSend("/topic/mapa-leitos", leitoRepository.findAll());
                        }
                    });
        } else if (req.desfecho() == DesfechoClinico.INTERNACAO) {
            boletim.setStatus(StatusAtendimento.AGUARDANDO_LEITO);
            boletimRepository.save(boletim);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(pep);
    }

    @GetMapping("/pep/paciente/{identificador}/historico")
    public List<AtendimentoPep> consultarHistorico(@PathVariable String identificador) {
        return pepRepository.buscarHistoricoPorCpfOuProntuario(identificador);
    }

    @PostMapping("/pep/atendimentos/{atendimentoId}/prescricoes")
    public ResponseEntity<Prescricao> prescreverMedicamento(
            @PathVariable UUID atendimentoId, @Valid @RequestBody PrescricaoRequest req) {
        AtendimentoPep pep = pepRepository.findById(atendimentoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Atendimento não encontrado"));
        CatalogoMedicamento med = medicamentoRepository.findById(req.medicamentoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicamento não encontrado"));
        return ResponseEntity.status(HttpStatus.CREATED).body(prescricaoRepository.save(Prescricao.builder()
                .atendimentoPep(pep).medicamento(med).dosagem(req.dosagem())
                .viaAdministracao(req.viaAdministracao()).intervalo(req.intervalo()).observacoes(req.observacoes()).build()));
    }

    @GetMapping("/medicamentos/autocomplete")
    public List<CatalogoMedicamento> autocompleteMedicamentos(@RequestParam("termo") String termo) {
        return medicamentoRepository.buscarAutocomplete(termo);
    }
}
