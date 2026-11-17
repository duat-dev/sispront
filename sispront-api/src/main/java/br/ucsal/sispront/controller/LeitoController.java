package br.ucsal.sispront.controller;

import br.ucsal.sispront.domain.entity.*;
import br.ucsal.sispront.domain.enums.Enums.*;
import br.ucsal.sispront.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leitos")
@RequiredArgsConstructor
public class LeitoController {
    private final LeitoRepository leitoRepository;
    private final BoletimAtendimentoRepository boletimRepository;
    private final OcupacaoHistoricoLeitoRepository historicoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public record AlocacaoRequest(@NotNull UUID boletimId) {}

    @GetMapping("/mapa")
    public List<Leito> listarMapaLeitos() { return leitoRepository.findAll(); }

    @GetMapping("/compativeis")
    public List<Leito> listarCompativeis(@RequestParam String especialidade, @RequestParam String sexo) {
        return leitoRepository.buscarLeitosCompativeis(StatusLeito.LIVRE, especialidade, sexo);
    }

    @PatchMapping("/{id}/alocar")
    @Transactional
    public Leito alocarPaciente(@PathVariable UUID id, @Valid @RequestBody AlocacaoRequest req, @AuthenticationPrincipal Usuario usuario) {
        Leito leito = leitoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leito não encontrado"));
        if (leito.getStatus() != StatusLeito.LIVRE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O leito selecionado não está LIVRE");
        }
        BoletimAtendimento boletim = boletimRepository.findById(req.boletimId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Boletim não encontrado"));

        leito.setStatus(StatusLeito.OCUPADO);
        leitoRepository.save(leito);
        boletim.setStatus(StatusAtendimento.INTERNADO);
        boletimRepository.save(boletim);

        historicoRepository.save(OcupacaoHistoricoLeito.builder()
                .leito(leito).boletim(boletim).usuarioResponsavel(usuario).tipoEvento(EventoLeito.ALOCACAO).build());
        messagingTemplate.convertAndSend("/topic/mapa-leitos", leitoRepository.findAll());
        return leito;
    }

    @PostMapping("/qrcode/{qrCodeHash}/scan")
    @Transactional
    public Leito processarScanQrCodeHigienizacao(@PathVariable String qrCodeHash, @AuthenticationPrincipal Usuario funcionarioLimpeza) {
        Leito leito = leitoRepository.findByQrCodeHash(qrCodeHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "QR Code inválido"));
        EventoLeito evento;
        if (leito.getStatus() == StatusLeito.AGUARDANDO_LIMPEZA) {
            leito.setStatus(StatusLeito.EM_LIMPEZA);
            evento = EventoLeito.INICIO_HIGIENIZACAO_SCAN1;
        } else if (leito.getStatus() == StatusLeito.EM_LIMPEZA) {
            leito.setStatus(StatusLeito.LIVRE);
            evento = EventoLeito.FIM_HIGIENIZACAO_SCAN2;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leito fora do fluxo de higienização");
        }
        leitoRepository.save(leito);
        historicoRepository.save(OcupacaoHistoricoLeito.builder()
                .leito(leito).usuarioResponsavel(funcionarioLimpeza).tipoEvento(evento).build());
        messagingTemplate.convertAndSend("/topic/mapa-leitos", leitoRepository.findAll());
        return leito;
    }
}
