package com.whitecoder.retailpos.config;

import com.whitecoder.retailpos.model.*;
import com.whitecoder.retailpos.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seedData(UserRepository userRepository, CategoryRepository categoryRepository, ProductRepository productRepository, CustomerRepository customerRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByUsername("admin")) {
                UserAccount admin = new UserAccount();
                admin.setUsername("admin");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setFullName("Store Administrator");
                admin.setEmail("admin@retailpos.lk");
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
            }
            if (!userRepository.existsByUsername("cashier")) {
                UserAccount cashier = new UserAccount();
                cashier.setUsername("cashier");
                cashier.setPasswordHash(passwordEncoder.encode("cashier123"));
                cashier.setFullName("Main Cashier");
                cashier.setEmail("cashier@retailpos.lk");
                cashier.setRole(Role.CASHIER);
                userRepository.save(cashier);
            }
            if (categoryRepository.count() == 0) {
                Category grocery = category("Grocery", "Daily essentials and packaged grocery items");
                Category beverages = category("Beverages", "Tea, juice, water and soft drinks");
                Category household = category("Household", "Home care and cleaning products");
                Category bakery = category("Bakery", "Fresh bakery and snack items");
                categoryRepository.saveAll(List.of(grocery, beverages, household, bakery));
                productRepository.saveAll(List.of(
                        product(grocery, "Ceylon Samba Rice 5kg", "Premium Sri Lankan samba rice pack", new BigDecimal("1850.00"), 30, "4791001000011", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80"),
                        product(grocery, "Red Dhal 1kg", "High quality dhal for daily cooking", new BigDecimal("620.00"), 45, "4791001000028", "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=80"),
                        product(grocery, "Coconut Oil 750ml", "Cooking coconut oil bottle", new BigDecimal("980.00"), 18, "4791001000035", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80"),
                        product(beverages, "Ceylon Black Tea 400g", "Sri Lankan black tea pack", new BigDecimal("790.00"), 22, "4791001000042", "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=900&q=80"),
                        product(beverages, "King Coconut Water", "Fresh king coconut beverage", new BigDecimal("280.00"), 60, "4791001000059", "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=900&q=80"),
                        product(beverages, "Bottled Water 1L", "Clean drinking water bottle", new BigDecimal("120.00"), 90, "4791001000066", "https://images.unsplash.com/photo-1553531384-411a247ccd73?auto=format&fit=crop&w=900&q=80"),
                        product(household, "Detergent Powder 1kg", "Household washing powder", new BigDecimal("980.00"), 8, "4791001000073", "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80"),
                        product(household, "Dish Wash Liquid", "Kitchen cleaning liquid", new BigDecimal("450.00"), 5, "4791001000080", "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=900&q=80"),
                        product(bakery, "Butter Cake Slice", "Fresh bakery cake slice", new BigDecimal("180.00"), 35, "4791001000097", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80"),
                        product(bakery, "Fish Bun", "Local bakery short-eat", new BigDecimal("160.00"), 28, "4791001000103", "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80")
                ));
            }
            if (customerRepository.count() == 0) {
                Customer c1 = customer("Walk-in Customer", "", "", "");
                Customer c2 = customer("Kasun Perera", "0771234567", "kasun@example.com", "Galle, Sri Lanka");
                Customer c3 = customer("Nimali Fernando", "0712345678", "nimali@example.com", "Matara, Sri Lanka");
                customerRepository.saveAll(List.of(c1, c2, c3));
            }
        };
    }

    private Category category(String name, String description) {
        Category c = new Category();
        c.setCategoryName(name);
        c.setDescription(description);
        c.setStatus(true);
        return c;
    }

    private Product product(Category category, String name, String description, BigDecimal price, int stock, String barcode, String imageUrl) {
        Product p = new Product();
        p.setCategory(category);
        p.setProductName(name);
        p.setDescription(description);
        p.setPrice(price);
        p.setStockQuantity(stock);
        p.setBarcode(barcode);
        p.setImageUrl(imageUrl);
        p.setStatus(true);
        return p;
    }

    private Customer customer(String name, String phone, String email, String address) {
        Customer c = new Customer();
        c.setName(name);
        c.setPhone(phone.isBlank() ? null : phone);
        c.setEmail(email.isBlank() ? null : email);
        c.setAddress(address);
        return c;
    }
}
