package com.duavero.core.logging;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SensitiveDataMasker {

    private static final Pattern SENSITIVE_JSON_PATTERN = Pattern.compile(
            "\"(password|passwordHash|secret|token|accessToken|refreshToken|otp|cvv|mfaSecret|masterKey|keySecret)\"\\s*:\\s*\"([^\"]+)\"",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SENSITIVE_KV_PATTERN = Pattern.compile(
            "(password|secret|token|key|cvv|otp)\\s*=\\s*([^,\\s)]+)",
            Pattern.CASE_INSENSITIVE
    );

    private SensitiveDataMasker() {}

    public static String mask(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        Matcher jsonMatcher = SENSITIVE_JSON_PATTERN.matcher(input);
        StringBuffer sb = new StringBuffer();
        while (jsonMatcher.find()) {
            String key = jsonMatcher.group(1);
            jsonMatcher.appendReplacement(sb, "\"" + key + "\":\"***REDACTED***\"");
        }
        jsonMatcher.appendTail(sb);

        Matcher kvMatcher = SENSITIVE_KV_PATTERN.matcher(sb.toString());
        StringBuffer finalSb = new StringBuffer();
        while (kvMatcher.find()) {
            String key = kvMatcher.group(1);
            kvMatcher.appendReplacement(finalSb, key + "=***REDACTED***");
        }
        kvMatcher.appendTail(finalSb);

        return finalSb.toString();
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 2) {
            return "***" + email.substring(atIndex);
        }
        return email.substring(0, 2) + "***" + email.substring(atIndex - 1);
    }

    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }
        return phone.substring(0, 2) + "******" + phone.substring(phone.length() - 2);
    }
}
