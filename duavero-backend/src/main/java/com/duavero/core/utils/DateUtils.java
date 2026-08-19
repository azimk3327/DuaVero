package com.duavero.core.utils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class DateUtils {

    public static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
    public static final ZoneId UTC_ZONE = ZoneId.of("UTC");
    public static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT;
    public static final DateTimeFormatter INDIAN_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter INDIAN_DATETIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");

    private DateUtils() {}

    public static String formatIso(Instant instant) {
        return instant != null ? ISO_FORMATTER.format(instant) : null;
    }

    public static String formatIndianDate(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(INDIAN_DATE_FORMAT) : null;
    }

    public static String formatIndianDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(INDIAN_DATETIME_FORMAT) : null;
    }
}
