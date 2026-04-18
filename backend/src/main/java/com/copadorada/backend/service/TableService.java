package com.copadorada.backend.service;

import com.copadorada.backend.dto.CreateTableRequest;
import com.copadorada.backend.dto.TableDto;
import com.copadorada.backend.repository.TableRepository;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
public class TableService {

    private final TableRepository tableRepository;

    public TableService(TableRepository tableRepository) {
        this.tableRepository = tableRepository;
    }

    public List<TableDto> getTables(Long branchId) {
        return tableRepository.findByBranch(branchId);
    }

    public long createTable(CreateTableRequest request) {
        if (request.branchId() == null) throw new IllegalArgumentException("branchId is required");
        if (request.number() == null || request.number().isBlank()) throw new IllegalArgumentException("Table number is required");
        try {
            return tableRepository.create(request.branchId(), request.number().trim());
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Table number already exists in this branch.");
        }
    }

    public void deleteTable(Long tableId) {
        try {
            tableRepository.delete(tableId);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Cannot delete table: it has associated orders.");
        }
    }
}
