package com.whitecoder.retailpos.service;

import com.whitecoder.retailpos.dto.CustomerDto;
import com.whitecoder.retailpos.dto.CustomerRequest;
import com.whitecoder.retailpos.exception.ApiException;
import com.whitecoder.retailpos.model.Customer;
import com.whitecoder.retailpos.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CustomerService {
    private final CustomerRepository customerRepository;
    private final MapperService mapper;

    public CustomerService(CustomerRepository customerRepository, MapperService mapper) {
        this.customerRepository = customerRepository;
        this.mapper = mapper;
    }

    public List<CustomerDto> search(String query) {
        String q = query == null || query.isBlank() ? null : query.trim();
        return customerRepository.search(q).stream().map(mapper::customer).toList();
    }

    @Transactional
    public CustomerDto create(CustomerRequest request) {
        Customer c = new Customer();
        apply(c, request);
        return mapper.customer(customerRepository.save(c));
    }

    @Transactional
    public CustomerDto update(Long id, CustomerRequest request) {
        Customer c = customerRepository.findById(id).orElseThrow(() -> new ApiException("Customer not found", HttpStatus.NOT_FOUND));
        apply(c, request);
        return mapper.customer(customerRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new ApiException("Customer not found", HttpStatus.NOT_FOUND);
        }
        customerRepository.deleteById(id);
    }

    private void apply(Customer c, CustomerRequest request) {
        c.setName(request.name().trim());
        c.setPhone(request.phone());
        c.setEmail(request.email());
        c.setAddress(request.address());
    }
}
