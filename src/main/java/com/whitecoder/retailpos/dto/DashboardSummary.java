package com.whitecoder.retailpos.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardSummary(
        BigDecimal totalSales,
        BigDecimal todaySales,
        long totalOrders,
        long todayOrders,
        long productCount,
        long customerCount,
        List<ProductDto> lowStockProducts,
        List<TopProductDto> topProducts,
        Map<String, BigDecimal> lastSevenDaysSales
) {
}
