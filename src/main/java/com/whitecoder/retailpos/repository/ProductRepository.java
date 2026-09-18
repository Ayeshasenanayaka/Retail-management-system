package com.whitecoder.retailpos.repository;

import com.whitecoder.retailpos.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByBarcode(String barcode);

    @Query("select p from Product p where (:query is null or lower(p.productName) like lower(concat('%', :query, '%')) or lower(p.barcode) like lower(concat('%', :query, '%'))) and (:categoryId is null or p.category.categoryId = :categoryId) order by p.productName asc")
    List<Product> search(@Param("query") String query, @Param("categoryId") Long categoryId);

    List<Product> findTop10ByStockQuantityLessThanEqualOrderByStockQuantityAsc(int quantity);
}
