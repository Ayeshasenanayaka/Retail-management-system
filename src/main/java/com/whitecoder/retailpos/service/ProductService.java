package com.whitecoder.retailpos.service;

import com.whitecoder.retailpos.dto.ProductDto;
import com.whitecoder.retailpos.dto.ProductRequest;
import com.whitecoder.retailpos.exception.ApiException;
import com.whitecoder.retailpos.model.Category;
import com.whitecoder.retailpos.model.Product;
import com.whitecoder.retailpos.model.StockLog;
import com.whitecoder.retailpos.repository.CategoryRepository;
import com.whitecoder.retailpos.repository.ProductRepository;
import com.whitecoder.retailpos.repository.StockLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockLogRepository stockLogRepository;
    private final MapperService mapper;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository, StockLogRepository stockLogRepository, MapperService mapper) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.stockLogRepository = stockLogRepository;
        this.mapper = mapper;
    }

    public List<ProductDto> search(String query, Long categoryId) {
        String q = query == null || query.isBlank() ? null : query.trim();
        return productRepository.search(q, categoryId).stream().map(mapper::product).toList();
    }

    public ProductDto get(Long id) {
        return mapper.product(find(id));
    }

    @Transactional
    public ProductDto create(ProductRequest request) {
        if (request.barcode() != null && !request.barcode().isBlank() && productRepository.existsByBarcode(request.barcode())) {
            throw new ApiException("Barcode already exists", HttpStatus.CONFLICT);
        }
        Product p = new Product();
        apply(p, request);
        Product saved = productRepository.save(p);
        saveStockLog(saved, saved.getStockQuantity(), "INITIAL_STOCK");
        return mapper.product(saved);
    }

    @Transactional
    public ProductDto update(Long id, ProductRequest request) {
        Product p = find(id);
        int previousStock = p.getStockQuantity();
        apply(p, request);
        p.setUpdatedAt(LocalDateTime.now());
        Product saved = productRepository.save(p);
        int diff = saved.getStockQuantity() - previousStock;
        if (diff != 0) {
            saveStockLog(saved, diff, "STOCK_UPDATE");
        }
        return mapper.product(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ApiException("Product not found", HttpStatus.NOT_FOUND);
        }
        productRepository.deleteById(id);
    }

    public Product find(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));
    }

    private void apply(Product p, ProductRequest request) {
        Category category = categoryRepository.findById(request.categoryId()).orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND));
        p.setCategory(category);
        p.setProductName(request.productName().trim());
        p.setDescription(request.description());
        p.setPrice(request.price());
        p.setStockQuantity(request.stockQuantity());
        p.setBarcode(request.barcode() == null || request.barcode().isBlank() ? null : request.barcode().trim());
        p.setImageUrl(request.imageUrl());
        p.setStatus(request.status() == null || request.status());
    }

    private void saveStockLog(Product product, int changeAmount, String reason) {
        StockLog log = new StockLog();
        log.setProduct(product);
        log.setStockQuantity(product.getStockQuantity());
        log.setChangeAmount(changeAmount);
        log.setReason(reason);
        stockLogRepository.save(log);
    }
}
