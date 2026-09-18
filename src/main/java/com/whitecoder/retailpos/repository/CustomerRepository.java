package com.whitecoder.retailpos.repository;

import com.whitecoder.retailpos.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    @Query("select c from Customer c where :query is null or lower(c.name) like lower(concat('%', :query, '%')) or lower(c.phone) like lower(concat('%', :query, '%')) or lower(c.email) like lower(concat('%', :query, '%')) order by c.name asc")
    List<Customer> search(@Param("query") String query);
}
