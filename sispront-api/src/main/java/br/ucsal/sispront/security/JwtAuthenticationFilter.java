package br.ucsal.sispront.security;

import br.ucsal.sispront.domain.entity.Usuario;
import br.ucsal.sispront.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    @Value("${sispront.security.inactivity-timeout-minutes}")
    private long inactivityTimeoutMinutes;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            String token = authHeader.substring(7);
            String login = jwtService.extractLogin(token);
            if (login != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Usuario usuario = usuarioRepository.findByLogin(login).orElse(null);
                if (usuario != null && usuario.isAtivo()) {
                    if (usuario.getUltimoAcesso() != null &&
                        Duration.between(usuario.getUltimoAcesso(), OffsetDateTime.now()).toMinutes() >= inactivityTimeoutMinutes) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.getWriter().write("{\"erro\":\"Sessao encerrada por inatividade (10 min)\"}");
                        return;
                    }
                    usuario.setUltimoAcesso(OffsetDateTime.now());
                    usuarioRepository.save(usuario);
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getPerfil().name()));
                    var authToken = new UsernamePasswordAuthenticationToken(usuario, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ignored) {
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }
}
