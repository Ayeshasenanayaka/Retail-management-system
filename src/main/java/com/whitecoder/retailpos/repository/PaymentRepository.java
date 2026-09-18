package com.whitecoder.retailpos.repository;

import com.whitecoder.retailpos.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
}
