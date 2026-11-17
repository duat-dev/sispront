package br.ucsal.sispront.controller;

import br.ucsal.sispront.domain.entity.*;
import br.ucsal.sispront.domain.enums.Enums.CorManchester;
import br.ucsal.sispront.domain.enums.Enums.StatusAtendimento;
import br.ucsal.sispront.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TriagemFilaController {
    private final TriagemRepository triagemRepository;
    private final BoletimAtendimentoRepository boletimRepository;
    private final FilaAtendimentoRepository filaRepository;
    private final AlertaRetriagemRepository alertaRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public record SinaisVitaisDTO(
            @NotNull @Min(0) @Max(100) Integer saturacaoO2,
            @NotNull @Min(20) @Max(250) Integer frequenciaCardiaca,
            @NotBlank String pressaoArterial,
            @NotNull @DecimalMin("30.0") @DecimalMax("45.0") BigDecimal temperatura,
            Integer glicemia
    ) {}

    public record TriagemRequest(
            @NotNull UUID boletimId, @NotBlank String queixaPrincipal, @Valid @NotNull SinaisVitaisDTO sinaisVitais,
            CorManchester classificacaoManual, String justificativaSobreposicao, boolean isRetriagem, boolean sincronizadoOffline
    ) {}

    public CorManchester calcularManchester(SinaisVitaisDTO s) {
        double temp = s.temperatura().doubleValue();
        if (s.saturacaoO2() < 85 || s.frequenciaCardiaca() > 180 || s.frequenciaCardiaca() < 40 || temp >= 41.0) return CorManchester.VERMELHO;
        if (s.saturacaoO2() < 90 || s.frequenciaCardiaca() > 140 || temp >= 39.5 || (s.glicemia() != null && (s.glicemia() < 50 || s.glicemia() > 400))) return CorManchester.LARANJA;
        if (s.saturacaoO2() < 94 || s.frequenciaCardiaca() > 110 || temp >= 38.0) return CorManchester.AMARELO;
        if (temp >= 37.3 || s.frequenciaCardiaca() > 100) return CorManchester.VERDE;
        return CorManchester.AZUL;
    }

    @PostMapping("/triagens/calcular-risco")
    public CorManchester sugerirClassificacao(@Valid @RequestBody SinaisVitaisDTO sinais) {
        return calcularManchester(sinais);
    }

    @PostMapping("/triagens")
    @Transactional
    public ResponseEntity<Triagem> registrarTriagem(@Valid @RequestBody TriagemRequest req, @AuthenticationPrincipal Usuario enfermeiro) {
        BoletimAtendimento boletim = boletimRepository.findById(req.boletimId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Boletim não encontrado"));
        CorManchester sugerida = calcularManchester(req.sinaisVitais());
        CorManchester corFinal = (req.classificacaoManual() != null) ? req.classificacaoManual() : sugerida;

        if (corFinal != sugerida && (req.justificativaSobreposicao() == null || req.justificativaSobreposicao().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Justificativa obrigatória ao sobrepor cor de Manchester (RF03)");
        }

        Triagem triagem = triagemRepository.save(Triagem.builder()
                .boletim(boletim).enfermeiro(enfermeiro).queixaPrincipal(req.queixaPrincipal())
                .saturacaoO2(req.sinaisVitais().saturacaoO2()).frequenciaCardiaca(req.sinaisVitais().frequenciaCardiaca())
                .pressaoArterial(req.sinaisVitais().pressaoArterial()).temperatura(req.sinaisVitais().temperatura())
                .glicemia(req.sinaisVitais().glicemia()).classificacaoSugerida(sugerida).classificacaoFinal(corFinal)
                .justificativaSobreposicao(req.justificativaSobreposicao()).isRetriagem(req.isRetriagem())
                .sincronizadoOffline(req.sincronizadoOffline()).build());

        boletim.setStatus(StatusAtendimento.AGUARDANDO_ATENDIMENTO);
        boletimRepository.save(boletim);

        FilaAtendimento itemFila = filaRepository.findByBoletimId(boletim.getId())
                .map(f -> {
                    f.setTriagemAtual(triagem);
                    f.setPrioridadeCor(corFinal);
                    f.setPesoPrioridade(corFinal.getPeso());
                    f.setTempoLimiteMinutos(corFinal.getTempoLimiteMinutos());
                    f.setAlertaRetriagemAtivo(false);
                    f.setAtiva(true);
                    return f;
                })
                .orElseGet(() -> FilaAtendimento.builder()
                        .boletim(boletim).triagemAtual(triagem).prioridadeCor(corFinal)
                        .pesoPrioridade(corFinal.getPeso()).horaEntradaFila(OffsetDateTime.now())
                        .tempoLimiteMinutos(corFinal.getTempoLimiteMinutos()).alertaRetriagemAtivo(false).ativa(true).build());

        filaRepository.save(itemFila);
        messagingTemplate.convertAndSend("/topic/fila-atendimento", listarFilaOrdenada());
        return ResponseEntity.status(HttpStatus.CREATED).body(triagem);
    }

    @GetMapping("/fila")
    public List<FilaAtendimento> listarFilaOrdenada() {
        return filaRepository.findByAtivaTrueOrderByPesoPrioridadeAscHoraEntradaFilaAsc();
    }

    @PostMapping("/fila/{boletimId}/chamar")
    @Transactional
    public BoletimAtendimento chamarPacienteParaAtendimento(@PathVariable UUID boletimId) {
        FilaAtendimento item = filaRepository.findByBoletimId(boletimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente não está na fila"));
        item.setAtiva(false);
        filaRepository.save(item);
        BoletimAtendimento boletim = item.getBoletim();
        boletim.setStatus(StatusAtendimento.EM_ATENDIMENTO);
        boletimRepository.save(boletim);
        messagingTemplate.convertAndSend("/topic/fila-atendimento", listarFilaOrdenada());
        return boletim;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void monitorarTemposDeEsperaFila() {
        List<FilaAtendimento> filaAtiva = filaRepository.findByAtivaTrueOrderByPesoPrioridadeAscHoraEntradaFilaAsc();
        OffsetDateTime agora = OffsetDateTime.now();
        for (FilaAtendimento item : filaAtiva) {
            long minutosEspera = Duration.between(item.getHoraEntradaFila(), agora).toMinutes();
            if (minutosEspera > item.getTempoLimiteMinutos() && !item.isAlertaRetriagemAtivo()) {
                item.setAlertaRetriagemAtivo(true);
                filaRepository.save(item);
                AlertaRetriagem alerta = alertaRepository.save(AlertaRetriagem.builder()
                        .fila(item).tempoExcedidoMinutos((int) (minutosEspera - item.getTempoLimiteMinutos())).build());
                messagingTemplate.convertAndSend("/topic/alertas-retriagem", alerta);
            }
        }
    }
}
