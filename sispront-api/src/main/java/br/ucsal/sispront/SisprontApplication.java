package br.ucsal.sispront;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SisprontApplication {
    public static void main(String[] args) {
        SpringApplication.run(SisprontApplication.class, args);
    }
}
