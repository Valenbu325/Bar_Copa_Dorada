package com.copadorada.backend.util;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class SortingUtils {

    private SortingUtils() {}

    public static <T> List<T> mergeSort(List<T> input, Comparator<T> comparator) {
        if (input == null || input.isEmpty()) {
            return List.of();
        }
        if (input.size() <= 1) {
            return new ArrayList<>(input);
        }
        int mid = input.size() / 2;
        List<T> left = mergeSort(input.subList(0, mid), comparator);
        List<T> right = mergeSort(input.subList(mid, input.size()), comparator);
        return merge(left, right, comparator);
    }

    private static <T> List<T> merge(List<T> left, List<T> right, Comparator<T> comparator) {
        List<T> sorted = new ArrayList<>(left.size() + right.size());
        int i = 0;
        int j = 0;
        while (i < left.size() && j < right.size()) {
            if (comparator.compare(left.get(i), right.get(j)) <= 0) {
                sorted.add(left.get(i++));
            } else {
                sorted.add(right.get(j++));
            }
        }
        while (i < left.size()) {
            sorted.add(left.get(i++));
        }
        while (j < right.size()) {
            sorted.add(right.get(j++));
        }
        return sorted;
    }
}

