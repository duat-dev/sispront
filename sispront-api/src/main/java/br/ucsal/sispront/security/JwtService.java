package br.ucsal.sispront.security;

import br.ucsal.sispront.domain.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtService(
            @Value("${sispront.security.jwt-secret}") String secret,
            @Value("${sispront.security.inactivity-timeout-minutes}") long timeoutMinutes) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMillis = timeoutMinutes * 60 * 1000L;
    }

    public String generateToken(Usuario usuario) {
        return Jwts.builder()
                .subject(usuario.getLogin())
                .claims(Map.of(
                        "userId", usuario.getId().toString(),
                        "perfil", usuario.getPerfil().name(),
                        "nome", usuario.getNome()
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(signingKey)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
    }

    public String extractLogin(String token) {
        return extractAllClaims(token).getSubject();
    }
}
