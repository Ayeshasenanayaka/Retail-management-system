package com.whitecoder.retailpos.repository;

import com.whitecoder.retailpos.model.SaleOrder;
import com.whitecoder.retailpos.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<SaleOrder, Long> {
    Optional<SaleOrder> findByInvoiceNo(String invoiceNo);
    long countByOrderDateBetween(LocalDateTime start, LocalDateTime end);
    List<SaleOrder> findTop20ByOrderByOrderDateDesc();
    List<SaleOrder> findTop20ByCashierOrderByOrderDateDesc(UserAccount cashier);
    List<SaleOrder> findByOrderDateBetween(LocalDateTime start, LocalDateTime end);
}
