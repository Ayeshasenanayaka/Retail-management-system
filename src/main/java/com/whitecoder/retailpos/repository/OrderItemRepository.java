package com.whitecoder.retailpos.repository;

import com.whitecoder.retailpos.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
