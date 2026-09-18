package com.whitecoder.retailpos.service;

import com.whitecoder.retailpos.dto.CategoryDto;
import com.whitecoder.retailpos.dto.CategoryRequest;
import com.whitecoder.retailpos.exception.ApiException;
import com.whitecoder.retailpos.model.Category;
import com.whitecoder.retailpos.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final MapperService mapper;

    public CategoryService(CategoryRepository categoryRepository, MapperService mapper) {
        this.categoryRepository = categoryRepository;
        this.mapper = mapper;
    }

    public List<CategoryDto> all() {
        return categoryRepository.findAll().stream().map(mapper::category).toList();
    }

    @Transactional
    public CategoryDto create(CategoryRequest request) {
        if (categoryRepository.existsByCategoryNameIgnoreCase(request.categoryName())) {
            throw new ApiException("Category name already exists", HttpStatus.CONFLICT);
        }
        Category c = new Category();
        apply(c, request);
        return mapper.category(categoryRepository.save(c));
    }

    @Transactional
    public CategoryDto update(Long id, CategoryRequest request) {
        Category c = categoryRepository.findById(id).orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND));
        apply(c, request);
        c.setUpdatedAt(LocalDateTime.now());
        return mapper.category(categoryRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ApiException("Category not found", HttpStatus.NOT_FOUND);
        }
        categoryRepository.deleteById(id);
    }

    private void apply(Category c, CategoryRequest request) {
        c.setCategoryName(request.categoryName().trim());
        c.setDescription(request.description());
        c.setStatus(request.status() == null || request.status());
    }
}
