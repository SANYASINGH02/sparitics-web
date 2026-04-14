package com.sparitics.util;

import java.time.LocalDate;

public final class PasscodeUtil {

    private PasscodeUtil() {
    }

    public static int generateDailyPasscode() {
        return generateDailyPasscode(LocalDate.now());
    }

    public static int generateDailyPasscode(LocalDate date) {
        int day = date.getDayOfMonth();
        int month = date.getMonthValue();
        int year = date.getYear();
        return ((day * month * year) % 10000) + 1999 + 2003;
    }
}
