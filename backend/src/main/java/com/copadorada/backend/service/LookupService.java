package com.copadorada.backend.service;

import com.copadorada.backend.dto.BranchDto;
import com.copadorada.backend.dto.RoleDto;
import com.copadorada.backend.repository.LookupRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class LookupService {

    private final LookupRepository lookupRepository;

    public LookupService(LookupRepository lookupRepository) {
        this.lookupRepository = lookupRepository;
    }

    public List<RoleDto> getRoles() {
        return lookupRepository.getRoles();
    }

    public List<BranchDto> getBranches() {
        return lookupRepository.getBranches();
    }
}

