package com.copadorada.backend.controller;

import com.copadorada.backend.dto.CreatePedidoRequest;
import com.copadorada.backend.dto.InventarioDto;
import com.copadorada.backend.dto.MesaDto;
import com.copadorada.backend.dto.PedidoDto;
import com.copadorada.backend.service.BarService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class BarController {

    private final BarService barService;

    public BarController(BarService barService) {
        this.barService = barService;
    }

    @GetMapping("/sedes")
    public List<String> sedes() {
        return barService.getSedes();
    }

    @GetMapping("/mesas")
    public List<MesaDto> mesas(@RequestParam("sede") String sede) {
        return barService.getMesas(sede);
    }

    @PatchMapping("/mesas/{id}/toggle")
    public ResponseEntity<MesaDto> toggleMesa(@PathVariable("id") long id) {
        return barService
                .toggleMesa(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/pedidos")
    public List<PedidoDto> pedidos(@RequestParam("sede") String sede) {
        return barService.getPedidos(sede);
    }

    @PostMapping("/pedidos")
    public ResponseEntity<Map<String, Long>> crearPedido(@RequestBody CreatePedidoRequest body) {
        long id = barService.createPedido(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }

    @PostMapping("/pedidos/{id}/cerrar")
    public ResponseEntity<Void> cerrarPedido(@PathVariable("id") long id) {
        boolean ok = barService.cerrarPedido(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/inventario")
    public List<InventarioDto> inventario(@RequestParam("sede") String sede) {
        return barService.getInventario(sede);
    }
}
