package com.copadorada.backend.service;

import com.copadorada.backend.dto.CreatePedidoRequest;
import com.copadorada.backend.dto.InventarioDto;
import com.copadorada.backend.dto.LoginResponse;
import com.copadorada.backend.dto.MesaDto;
import com.copadorada.backend.dto.PedidoDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BarService {

    private final JdbcTemplate jdbc;

    public BarService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<MesaDto> MESA_ROW =
            (rs, rowNum) -> new MesaDto(
                    rs.getLong("id"),
                    rs.getString("sede"),
                    rs.getString("numero"),
                    rs.getInt("cupo"),
                    rs.getBoolean("ocupada"));

    private static final RowMapper<PedidoDto> PEDIDO_ROW = (rs, rowNum) -> new PedidoDto(
            rs.getLong("id"),
            rs.getString("sede"),
            rs.getString("mesa"),
            rs.getString("cliente"),
            rs.getString("items"),
            rs.getBigDecimal("total"),
            rs.getString("estado"),
            rs.getString("metodo_pago"));

    private static final RowMapper<InventarioDto> INV_ROW = (rs, rowNum) -> new InventarioDto(
            rs.getLong("id"),
            rs.getString("sede"),
            rs.getString("producto"),
            rs.getInt("cantidad"),
            rs.getString("unidad"));

    public Optional<LoginResponse> login(String email, String password) {
        String sql =
                """
                SELECT u.id, u.nombre, u.email, u.rol, s.nombre AS sede
                FROM usuarios u
                JOIN sedes s ON u.sede_id = s.id
                WHERE u.email = ? AND u.clave = ?
                """;
        List<LoginResponse> rows =
                jdbc.query(sql, (rs, rowNum) -> new LoginResponse(
                        rs.getLong("id"),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getString("rol"),
                        rs.getString("sede")), email, password);
        return rows.stream().findFirst();
    }

    public List<String> getSedes() {
        return jdbc.query("SELECT nombre FROM sedes ORDER BY nombre", (rs, rowNum) -> rs.getString(1));
    }

    public List<MesaDto> getMesas(String sedeNombre) {
        String sql =
                """
                SELECT m.id, s.nombre AS sede, m.numero, m.cupo, m.ocupada
                FROM mesas m
                JOIN sedes s ON m.sede_id = s.id
                WHERE s.nombre = ?
                ORDER BY m.numero
                """;
        return jdbc.query(sql, MESA_ROW, sedeNombre);
    }

    @Transactional
    public Optional<MesaDto> toggleMesa(long mesaId) {
        int updated = jdbc.update("UPDATE mesas SET ocupada = NOT ocupada WHERE id = ?", mesaId);
        if (updated == 0) {
            return Optional.empty();
        }
        String sql =
                """
                SELECT m.id, s.nombre AS sede, m.numero, m.cupo, m.ocupada
                FROM mesas m
                JOIN sedes s ON m.sede_id = s.id
                WHERE m.id = ?
                """;
        return jdbc.query(sql, MESA_ROW, mesaId).stream().findFirst();
    }

    public List<PedidoDto> getPedidos(String sedeNombre) {
        String sql =
                """
                SELECT p.id, s.nombre AS sede, COALESCE(m.numero, '-') AS mesa,
                       p.cliente, p.items, p.total, p.estado, p.metodo_pago
                FROM pedidos p
                JOIN sedes s ON p.sede_id = s.id
                LEFT JOIN mesas m ON p.mesa_id = m.id
                WHERE s.nombre = ?
                ORDER BY p.id DESC
                """;
        return jdbc.query(sql, PEDIDO_ROW, sedeNombre);
    }

    @Transactional
    public long createPedido(CreatePedidoRequest req) {
        Long sedeId = jdbc.queryForObject(
                "SELECT id FROM sedes WHERE nombre = ?", Long.class, req.sede());
        Long mesaId = req.mesaId();
        String sql =
                """
                INSERT INTO pedidos (sede_id, mesa_id, cliente, items, total, estado, metodo_pago)
                VALUES (?, ?, ?, ?, ?, 'Abierto', ?)
                RETURNING id
                """;
        return jdbc.queryForObject(
                sql,
                Long.class,
                sedeId,
                mesaId,
                req.cliente(),
                req.items(),
                req.total() != null ? req.total() : BigDecimal.ZERO,
                req.metodoPago());
    }

    @Transactional
    public boolean cerrarPedido(long pedidoId) {
        return jdbc.update("UPDATE pedidos SET estado = 'Cerrado' WHERE id = ?", pedidoId) > 0;
    }

    public List<InventarioDto> getInventario(String sedeNombre) {
        String sql =
                """
                SELECT i.id, s.nombre AS sede, i.producto, i.cantidad, i.unidad
                FROM inventario i
                JOIN sedes s ON i.sede_id = s.id
                WHERE s.nombre = ?
                ORDER BY i.producto
                """;
        return jdbc.query(sql, INV_ROW, sedeNombre);
    }
}
