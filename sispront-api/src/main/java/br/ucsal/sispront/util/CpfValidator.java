package br.ucsal.sispront.util;

public final class CpfValidator {
    private CpfValidator() {}

    public static boolean isValid(String cpf) {
        if (cpf == null) return false;
        String digits = cpf.replaceAll("\\D", "");
        if (digits.length() != 11 || digits.matches("(\\d)\\1{10}")) return false;
        try {
            int d1 = calcularDigito(digits.substring(0, 9), 10);
            int d2 = calcularDigito(digits.substring(0, 9) + d1, 11);
            return digits.equals(digits.substring(0, 9) + d1 + d2);
        } catch (Exception e) {
            return false;
        }
    }

    private static int calcularDigito(String str, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < str.length(); i++) {
            soma += Character.getNumericValue(str.charAt(i)) * (pesoInicial - i);
        }
        int resto = 11 - (soma % 11);
        return (resto > 9) ? 0 : resto;
    }
}
