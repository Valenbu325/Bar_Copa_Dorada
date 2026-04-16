package com.copadorada.backend.util;

import java.util.ArrayList;
import java.util.List;

public final class HanoiUtils {

    private HanoiUtils() {}

    public record Move(String from, String to) {}

    public static List<Move> solve(int n) {
        List<Move> steps = new ArrayList<>();
        solveRecursive(n, "A", "C", "B", steps);
        return steps;
    }

    private static void solveRecursive(int n, String from, String to, String aux, List<Move> steps) {
        if (n <= 0) {
            return;
        }
        solveRecursive(n - 1, from, aux, to, steps);
        steps.add(new Move(from, to));
        solveRecursive(n - 1, aux, to, from, steps);
    }
}

