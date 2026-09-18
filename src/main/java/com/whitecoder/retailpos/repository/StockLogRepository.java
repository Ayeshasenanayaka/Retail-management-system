package com.whitecoder.retailpos.repository;

import com.whitecoder.retailpos.model.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockLogRepository extends JpaRepository<StockLog, Long> {
}
