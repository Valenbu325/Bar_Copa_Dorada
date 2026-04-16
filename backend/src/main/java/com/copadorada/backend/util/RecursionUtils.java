package com.copadorada.backend.util;

import java.math.BigDecimal;
import java.util.List;

public final class RecursionUtils {

    private RecursionUtils() {}

    public static BigDecimal sumBigDecimal(List<BigDecimal> values) {
        return sumBigDecimal(values, 0);
    }

    private static BigDecimal sumBigDecimal(List<BigDecimal> values, int index) {
        if (values == null || index >= values.size()) {
            return BigDecimal.ZERO;
        }
        BigDecimal current = values.get(index) == null ? BigDecimal.ZERO : values.get(index);
        return current.add(sumBigDecimal(values, index + 1));
    }
}

