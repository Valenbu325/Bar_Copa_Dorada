package com.copadorada.backend.controller;

import com.copadorada.backend.util.HanoiUtils;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal")
public class InternalController {

    @GetMapping("/hanoi")
    public List<HanoiUtils.Move> hanoi(@RequestParam(name = "n", defaultValue = "3") int n) {
        return HanoiUtils.solve(n);
    }
}

