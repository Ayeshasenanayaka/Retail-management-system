package com.whitecoder.retailpos.service;

import com.whitecoder.retailpos.dto.OrderCreateRequest;
import com.whitecoder.retailpos.dto.OrderDto;
import com.whitecoder.retailpos.exception.ApiException;
import com.whitecoder.retailpos.model.*;
import com.whitecoder.retailpos.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final StockLogRepository stockLogRepository;
    private final MapperService mapper;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository, CustomerRepository customerRepository, UserRepository userRepository, StockLogRepository stockLogRepository, MapperService mapper) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.stockLogRepository = stockLogRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<OrderDto> latest() {
        UserAccount user = currentUser();
        List<SaleOrder> orders = user.getRole() == Role.ADMIN
                ? orderRepository.findTop20ByOrderByOrderDateDesc()
                : orderRepository.findTop20ByCashierOrderByOrderDateDesc(user);
        return orders.stream().map(mapper::order).toList();
    }

    @Transactional(readOnly = true)
    public OrderDto get(Long id) {
        SaleOrder order = orderRepository.findById(id).orElseThrow(() -> new ApiException("Order not found", HttpStatus.NOT_FOUND));
        UserAccount user = currentUser();
        if (user.getRole() != Role.ADMIN && !order.getCashier().getUserId().equals(user.getUserId())) {
            throw new ApiException("You can view only your own invoices", HttpStatus.FORBIDDEN);
        }
        return mapper.order(order);
    }

    @Transactional
    public OrderDto create(OrderCreateRequest request) {
        UserAccount cashier = currentUser();
        Customer customer = request.customerId() == null ? null : customerRepository.findById(request.customerId()).orElseThrow(() -> new ApiException("Customer not found", HttpStatus.NOT_FOUND));
        SaleOrder order = new SaleOrder();
        order.setInvoiceNo(generateInvoiceNo());
        order.setCashier(cashier);
        order.setCustomer(customer);
        order.setNotes(clean(request.notes()));
        BigDecimal subTotal = BigDecimal.ZERO;
        for (var itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId()).orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));
            if (!product.isStatus()) {
                throw new ApiException(product.getProductName() + " is inactive", HttpStatus.BAD_REQUEST);
            }
            if (product.getStockQuantity() < itemRequest.quantity()) {
                throw new ApiException("Not enough stock for " + product.getProductName(), HttpStatus.BAD_REQUEST);
            }
            BigDecimal itemDiscount = safe(itemRequest.discount());
            BigDecimal line = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity())).subtract(itemDiscount);
            if (line.compareTo(BigDecimal.ZERO) < 0) {
                line = BigDecimal.ZERO;
            }
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setProductName(product.getProductName());
            item.setBarcode(product.getBarcode());
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(product.getPrice());
            item.setDiscount(itemDiscount);
            item.setTotalPrice(line);
            order.getItems().add(item);
            subTotal = subTotal.add(line);
            product.setStockQuantity(product.getStockQuantity() - itemRequest.quantity());
            productRepository.save(product);
            saveStockLog(product, -itemRequest.quantity(), "SALE_" + order.getInvoiceNo());
        }
        BigDecimal discount = safe(request.discount());
        if (discount.compareTo(subTotal) > 0) {
            throw new ApiException("Discount cannot be greater than subtotal", HttpStatus.BAD_REQUEST);
        }
        BigDecimal grand = subTotal.subtract(discount);
        if (grand.compareTo(BigDecimal.ZERO) < 0) {
            grand = BigDecimal.ZERO;
        }
        order.setSubTotal(subTotal);
        order.setDiscount(discount);
        order.setGrandTotal(grand);
        Payment payment = buildPayment(request, grand);
        payment.setOrder(order);
        order.setPayment(payment);
        return mapper.order(orderRepository.save(order));
    }

    private Payment buildPayment(OrderCreateRequest request, BigDecimal grand) {
        PaymentMethod method = parsePaymentMethod(request.paymentMethod());
        Payment payment = new Payment();
        payment.setAmount(grand);
        payment.setPaymentMethod(method);
        payment.setStatus(PaymentStatus.PAID);
        if (method == PaymentMethod.CASH) {
            BigDecimal tendered = safe(request.tenderedAmount());
            if (tendered.compareTo(grand) < 0) {
                throw new ApiException("Cash paid amount must be equal or greater than grand total", HttpStatus.BAD_REQUEST);
            }
            payment.setTenderedAmount(tendered);
            payment.setBalanceAmount(tendered.subtract(grand));
            payment.setTransactionId(clean(request.transactionId()));
        } else if (method == PaymentMethod.CARD) {
            String holder = clean(request.cardHolderName());
            String lastFour = clean(request.cardLastFour());
            String reference = clean(request.cardReferenceNo());
            if (holder == null || lastFour == null || lastFour.length() != 4 || reference == null) {
                throw new ApiException("Card holder name, last 4 digits and reference number are required", HttpStatus.BAD_REQUEST);
            }
            payment.setTenderedAmount(grand);
            payment.setBalanceAmount(BigDecimal.ZERO);
            payment.setCardHolderName(holder);
            payment.setCardLastFour(lastFour);
            payment.setCardReferenceNo(reference);
            payment.setTransactionId(reference);
        } else {
            String reference = clean(request.transactionId());
            if (reference == null) {
                throw new ApiException("Online payment reference number is required", HttpStatus.BAD_REQUEST);
            }
            payment.setTenderedAmount(grand);
            payment.setBalanceAmount(BigDecimal.ZERO);
            payment.setTransactionId(reference);
        }
        return payment;
    }

    private UserAccount currentUser() {
        String username = String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return userRepository.findByUsername(username).orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED));
    }

    private String generateInvoiceNo() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        long next = orderRepository.countByOrderDateBetween(start, end) + 1;
        String invoice;
        do {
            invoice = "INV-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", next++);
        } while (orderRepository.findByInvoiceNo(invoice).isPresent());
        return invoice;
    }

    private PaymentMethod parsePaymentMethod(String method) {
        try {
            return method == null || method.isBlank() ? PaymentMethod.CASH : PaymentMethod.valueOf(method.toUpperCase());
        } catch (Exception ex) {
            return PaymentMethod.CASH;
        }
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
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
