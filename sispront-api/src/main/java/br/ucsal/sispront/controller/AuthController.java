package br.ucsal.sispront.controller;

import br.ucsal.sispront.domain.entity.LogAuditoria;
import br.ucsal.sispront.domain.entity.Usuario;
import br.ucsal.sispront.repository.LogAuditoriaRepository;
import br.ucsal.sispront.repository.UsuarioRepository;
import br.ucsal.sispront.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final LogAuditoriaRepository auditoriaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${sispront.security.max-failed-attempts}")
    private int maxFailedAttempts;

    @Value("${sispront.security.lock-duration-minutes}")
    private int lockDurationMinutes;

    public record LoginRequest(@NotBlank String login, @NotBlank String senha) {}
    public record TokenResponse(String accessToken, String perfil, String nome) {}

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest httpReq) {
        Usuario usuario = usuarioRepository.findByLogin(req.login())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas"));

        if (usuario.getBloqueadoAte() != null && usuario.getBloqueadoAte().isAfter(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.LOCKED,
                    "Conta bloqueada ate " + usuario.getBloqueadoAte() + " devido a 3 tentativas invalidas (RNF03).");
        }

        if (!passwordEncoder.matches(req.senha(), usuario.getSenhaHash())) {
            int falhas = usuario.getTentativasFalhas() + 1;
            usuario.setTentativasFalhas(falhas);
            if (falhas >= maxFailedAttempts) {
                usuario.setBloqueadoAte(OffsetDateTime.now().plusMinutes(lockDurationMinutes));
            }
            usuarioRepository.save(usuario);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas");
        }

        usuario.setTentativasFalhas(0);
        usuario.setBloqueadoAte(null);
        usuario.setUltimoAcesso(OffsetDateTime.now());
        usuarioRepository.save(usuario);

        auditoriaRepository.save(LogAuditoria.builder()
                .usuario(usuario)
                .acao("LOGIN")
                .entidadeAfetada("Usuario")
                .entidadeId(usuario.getId())
                .ipOrigem(httpReq.getRemoteAddr())
                .build());

        return ResponseEntity.ok(new TokenResponse(
                jwtService.generateToken(usuario),
                usuario.getPerfil().name(),
                usuario.getNome()
        ));
    }

    @PostMapping("/logout")
    public Map<String, String> logout(@AuthenticationPrincipal Usuario usuario) {
        if (usuario != null) {
            usuario.setUltimoAcesso(OffsetDateTime.now().minusHours(1));
            usuarioRepository.save(usuario);
        }
        return Map.of("mensagem", "Sessao encerrada com sucesso");
    }
}
