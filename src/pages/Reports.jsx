import React, { useState, useMemo } from 'react';
import { api } from '../api';
import { 
  FileText, FileSpreadsheet, Download, Eye, Calendar, Filter, X, 
  RefreshCw, ArrowUp, ArrowDown, ArrowUpDown, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  if (num < 0) return `-₹${Math.abs(num).toFixed(2)}`;
  return `₹${num.toFixed(2)}`;
};

const isNumericKey = (key) => {
  return [
    'sold', 'revenue', 'profit', 'cogs', 'stock', 'payout', 
    'balance', 'issued', 'dispatches', 'dispatched', 'returned', 
    'damaged', 'cash', 'amount', 'margin', 'cost', 'price'
  ].includes(key);
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [loading, setLoading] = useState(false);
  const [loadingReportId, setLoadingReportId] = useState(null);
  const [previewModal, setPreviewModal] = useState(null); // { reportId, title, filterLabel, columns, rows, totalsRow, emptyMessage }

  // Sorting state for Preview modal table
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');

  // Report Types Config
  const reportsConfig = [
    {
      id: 'daily_sales',
      name: "Daily Sales Report",
      desc: "Detailed daily breakdown of stock dispatches, returned unsold items, damaged products, and gross revenue.",
      icon: "📊"
    },
    {
      id: 'monthly_sales',
      name: "Monthly Sales Report",
      desc: "Aggregated monthly sales performance, revenue trends, payouts, and net profits.",
      icon: "📅"
    },
    {
      id: 'product_sales',
      name: "Product-wise Sales",
      desc: "Sales volume, gross revenue, cost of goods (COGS), net profit, and net margin performance per product.",
      icon: "📦"
    },
    {
      id: 'hawker_performance',
      name: "Hawker Performance Report",
      desc: "Complete ranking of hawker sales volume, route assignments, collections, and outstanding debt.",
      icon: "👥"
    },
    {
      id: 'inventory_report',
      name: "Inventory Report",
      desc: "Current stock catalog, low-stock warnings, cost/selling valuation, and expiry status.",
      icon: "🏭"
    },
    {
      id: 'returns_report',
      name: "Returns Report",
      desc: "Dedicated log of returned unsold products, damaged items, damage remarks, and settlements.",
      icon: "🔄"
    },
    {
      id: 'profit_report',
      name: "Profit Report",
      desc: "Comprehensive profit & loss breakdown combining gross sales, COGS, commissions, and operating expenses.",
      icon: "📈"
    },
    {
      id: 'collection_report',
      name: "Collection Report",
      desc: "Ledger of cash and digital payment collections received from hawkers.",
      icon: "💰"
    }
  ];

  // Data Builder for each of the 8 reports
  const fetchReportData = async (reportId) => {
    setLoading(true);
    try {
      const [logs, products, hawkers, purchases, expenses, collections] = await Promise.all([
        api.get('/logs/'),
        api.get('/products/'),
        api.get('/hawkers/'),
        api.get('/purchases/'),
        api.get('/expenses/'),
        api.get('/collections/')
      ]);

      let title = "";
      let filterLabel = "";
      let emptyMessage = "";
      let columns = [];
      let rows = [];
      let totalsRow = null;
      let summaryLine = "";
      let summaryStats = [];

      const currentMonthName = monthNames[selectedMonth - 1] || 'Unknown Month';

      // 1. DAILY SALES REPORT
      if (reportId === 'daily_sales') {
        title = `Daily Sales Report (${selectedDate})`;
        filterLabel = `Specific Date: ${selectedDate}`;
        emptyMessage = `No sales or dispatch records found for ${selectedDate}. Try selecting a different date from the filter controls.`;

        columns = [
          { header: 'Date', key: 'date' },
          { header: 'Hawker', key: 'hawker' },
          { header: 'Route', key: 'route' },
          { header: 'Product', key: 'product' },
          { header: 'Dispatched', key: 'dispatched' },
          { header: 'Returned Unsold', key: 'returned' },
          { header: 'Damaged Qty', key: 'damaged' },
          { header: 'Sold Qty', key: 'sold' },
          { header: 'Unit Price', key: 'price' },
          { header: 'Gross Revenue', key: 'revenue' }
        ];

        const filtered = logs.filter(l => l.date === selectedDate);
        rows = filtered.map(log => {
          const h = hawkers.find(x => x.id === log.hawker_id) || { name: `Hawker #${log.hawker_id}`, route: log.route };
          const p = products.find(x => x.id === log.product_id) || { name: `Product #${log.product_id}`, selling_price: 0 };
          return {
            date: log.date,
            hawker: h.name,
            route: log.route || h.route || 'General Route',
            product: p.name,
            dispatched: log.dispatched_qty,
            returned: log.returned_qty,
            damaged: log.damaged_qty || 0,
            sold: log.sold_qty,
            price: formatCurrency(p.selling_price),
            revenue: formatCurrency(log.gross_revenue),
            raw_dispatched: log.dispatched_qty || 0,
            raw_returned: log.returned_qty || 0,
            raw_damaged: log.damaged_qty || 0,
            raw_sold: log.sold_qty || 0,
            raw_price: p.selling_price || 0,
            raw_revenue: log.gross_revenue || 0,
            isZeroSales: log.sold_qty === 0
          };
        });

        if (rows.length > 0) {
          const uniqueProducts = new Set(filtered.map(l => l.product_id).filter(Boolean)).size;
          const sumDispatched = rows.reduce((sum, r) => sum + r.raw_dispatched, 0);
          const sumReturned = rows.reduce((sum, r) => sum + r.raw_returned, 0);
          const sumDamaged = rows.reduce((sum, r) => sum + r.raw_damaged, 0);
          const sumSold = rows.reduce((sum, r) => sum + r.raw_sold, 0);
          const sumRevenue = rows.reduce((sum, r) => sum + r.raw_revenue, 0);

          totalsRow = {
            date: 'TOTAL',
            hawker: '',
            route: '',
            product: 'TOTAL',
            dispatched: sumDispatched,
            returned: sumReturned,
            damaged: sumDamaged,
            sold: sumSold,
            price: '',
            revenue: formatCurrency(sumRevenue),
            isTotal: true
          };

          summaryLine = `Total Sales Today: ${formatCurrency(sumRevenue)} across ${uniqueProducts} ${uniqueProducts === 1 ? 'product' : 'products'}`;
          summaryStats = [
            { label: 'Total Dispatched', value: sumDispatched },
            { label: 'Total Returned', value: sumReturned },
            { label: 'Total Damaged', value: sumDamaged },
            { label: 'Total Sold', value: sumSold }
          ];
        } else {
          summaryLine = `Total Sales Today: ₹0.00 across 0 products`;
        }
      }

      // 2. MONTHLY SALES REPORT
      else if (reportId === 'monthly_sales') {
        title = `Monthly Sales Report (${currentMonthName} ${selectedYear})`;
        filterLabel = `Month: ${currentMonthName} ${selectedYear}`;
        emptyMessage = `No sales data found for ${currentMonthName} ${selectedYear}. Try selecting a different month or year above.`;

        columns = [
          { header: 'Date', key: 'date' },
          { header: 'Dispatches Count', key: 'dispatches' },
          { header: 'Units Issued', key: 'issued' },
          { header: 'Units Sold', key: 'sold' },
          { header: 'Gross Revenue', key: 'revenue' },
          { header: 'Hawker Payout', key: 'payout' },
          { header: 'Net Profit', key: 'profit' }
        ];

        const filtered = logs.filter(l => {
          if (!l.date) return false;
          const [y, m] = l.date.split('-').map(Number);
          return y === selectedYear && m === selectedMonth;
        });

        // Group by date
        const dateGroups = {};
        filtered.forEach(log => {
          if (!dateGroups[log.date]) {
            dateGroups[log.date] = { date: log.date, dispatches: 0, issued: 0, sold: 0, revenue: 0, payout: 0, profit: 0 };
          }
          dateGroups[log.date].dispatches += 1;
          dateGroups[log.date].issued += log.dispatched_qty;
          dateGroups[log.date].sold += log.sold_qty;
          dateGroups[log.date].revenue += log.gross_revenue;
          dateGroups[log.date].payout += log.hawker_payout;
          dateGroups[log.date].profit += log.net_profit;
        });

        rows = Object.values(dateGroups).map(g => ({
          date: g.date,
          dispatches: g.dispatches,
          issued: g.issued,
          sold: g.sold,
          revenue: formatCurrency(g.revenue),
          payout: formatCurrency(g.payout),
          profit: formatCurrency(g.profit),
          raw_dispatches: g.dispatches,
          raw_issued: g.issued,
          raw_sold: g.sold,
          raw_revenue: g.revenue,
          raw_payout: g.payout,
          raw_profit: g.profit,
          isZeroSales: g.sold === 0
        }));

        if (rows.length > 0) {
          const uniqueProducts = new Set(filtered.map(l => l.product_id).filter(Boolean)).size;
          const sumDispatches = rows.reduce((sum, r) => sum + r.raw_dispatches, 0);
          const sumIssued = rows.reduce((sum, r) => sum + r.raw_issued, 0);
          const sumSold = rows.reduce((sum, r) => sum + r.raw_sold, 0);
          const sumRevenue = rows.reduce((sum, r) => sum + r.raw_revenue, 0);
          const sumPayout = rows.reduce((sum, r) => sum + r.raw_payout, 0);
          const sumProfit = rows.reduce((sum, r) => sum + r.raw_profit, 0);

          totalsRow = {
            date: 'TOTAL',
            dispatches: sumDispatches,
            issued: sumIssued,
            sold: sumSold,
            revenue: formatCurrency(sumRevenue),
            payout: formatCurrency(sumPayout),
            profit: formatCurrency(sumProfit),
            isTotal: true
          };

          summaryLine = `Total Sales This Month: ${formatCurrency(sumRevenue)} across ${uniqueProducts} ${uniqueProducts === 1 ? 'product' : 'products'}`;
          summaryStats = [
            { label: 'Active Days', value: rows.length },
            { label: 'Total Dispatches', value: sumDispatches },
            { label: 'Units Sold', value: sumSold },
            { label: 'Net Profit', value: formatCurrency(sumProfit) }
          ];
        } else {
          summaryLine = `Total Sales This Month: ₹0.00 across 0 products`;
        }
      }

      // 3. PRODUCT-WISE SALES REPORT
      else if (reportId === 'product_sales') {
        title = `Product-wise Sales Performance Report`;
        filterLabel = `All Products (Catalog Performance)`;
        emptyMessage = `No product records found in the database.`;

        columns = [
          { header: 'Product ID', key: 'id' },
          { header: 'Product Name', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Base Cost', key: 'cost' },
          { header: 'Selling Price', key: 'price' },
          { header: 'Current Stock', key: 'stock' },
          { header: 'Units Sold', key: 'sold' },
          { header: 'Gross Revenue', key: 'revenue' },
          { header: 'COGS', key: 'cogs' },
          { header: 'Net Profit', key: 'profit' },
          { header: 'Net Margin %', key: 'margin' }
        ];

        rows = products.map(p => {
          const pLogs = logs.filter(l => l.product_id === p.id);
          const totalSold = pLogs.reduce((sum, l) => sum + (l.sold_qty || 0), 0);
          const totalRev = pLogs.reduce((sum, l) => sum + (l.gross_revenue || 0), 0);
          
          // Cost of Goods Sold = Base Cost * Units Sold
          const cogs = (p.base_cost || 0) * totalSold;
          // Net Profit = (Selling Price - Base Cost) * Units Sold
          const netProfit = ((p.selling_price || 0) - (p.base_cost || 0)) * totalSold;
          // Net Margin % = (Net Profit / Gross Revenue) * 100
          const netMargin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

          return {
            id: `#${p.id}`,
            name: p.name,
            category: p.category || 'General',
            cost: formatCurrency(p.base_cost),
            price: formatCurrency(p.selling_price),
            stock: p.current_stock,
            sold: totalSold,
            revenue: formatCurrency(totalRev),
            cogs: formatCurrency(cogs),
            profit: formatCurrency(netProfit),
            margin: `${netMargin.toFixed(1)}%`,
            raw_id: p.id,
            raw_cost: p.base_cost || 0,
            raw_price: p.selling_price || 0,
            raw_stock: p.current_stock || 0,
            raw_sold: totalSold,
            raw_revenue: totalRev,
            raw_cogs: cogs,
            raw_profit: netProfit,
            raw_margin: netMargin,
            isZeroSales: totalSold === 0
          };
        });

        if (rows.length > 0) {
          const sumStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
          const sumSold = rows.reduce((sum, r) => sum + r.raw_sold, 0);
          const sumRevenue = rows.reduce((sum, r) => sum + r.raw_revenue, 0);
          const sumCogs = rows.reduce((sum, r) => sum + r.raw_cogs, 0);
          const sumProfit = rows.reduce((sum, r) => sum + r.raw_profit, 0);
          const overallMargin = sumRevenue > 0 ? (sumProfit / sumRevenue) * 100 : 0;

          totalsRow = {
            id: 'TOTAL',
            name: `${rows.length} Products`,
            category: '—',
            cost: '—',
            price: '—',
            stock: sumStock,
            sold: sumSold,
            revenue: formatCurrency(sumRevenue),
            cogs: formatCurrency(sumCogs),
            profit: formatCurrency(sumProfit),
            margin: `${overallMargin.toFixed(1)}%`,
            isTotal: true
          };

          summaryLine = `Total Product Sales: ${formatCurrency(sumRevenue)} across ${rows.length} ${rows.length === 1 ? 'product' : 'products'}`;
          summaryStats = [
            { label: 'Units Sold', value: sumSold },
            { label: 'Total Profit', value: formatCurrency(sumProfit) },
            { label: 'Net Margin', value: `${overallMargin.toFixed(1)}%` }
          ];
        }
      }

      // 4. HAWKER PERFORMANCE REPORT
      else if (reportId === 'hawker_performance') {
        title = `Hawker Performance & Ledger Report`;
        filterLabel = `All Registered Hawkers`;
        emptyMessage = `No hawkers found in the database.`;

        columns = [
          { header: 'Hawker ID', key: 'id' },
          { header: 'Hawker Name', key: 'name' },
          { header: 'Route Assignment', key: 'route' },
          { header: 'Status', key: 'status' },
          { header: 'Units Sold', key: 'sold' },
          { header: 'Total Revenue', key: 'revenue' },
          { header: 'Hawker Payout', key: 'payout' },
          { header: 'Account Balance', key: 'balance' }
        ];

        rows = hawkers.map(h => {
          const hLogs = logs.filter(l => l.hawker_id === h.id);
          const totalSold = hLogs.reduce((sum, l) => sum + (l.sold_qty || 0), 0);
          const totalRev = hLogs.reduce((sum, l) => sum + (l.gross_revenue || 0), 0);
          const totalPayout = hLogs.reduce((sum, l) => sum + (l.hawker_payout || 0), 0);

          return {
            id: `#${h.id}`,
            name: h.name,
            route: h.route || 'General Route',
            status: h.status ? 'Active' : 'Inactive',
            sold: totalSold,
            revenue: formatCurrency(totalRev),
            payout: formatCurrency(totalPayout),
            balance: formatCurrency(h.balance || 0),
            raw_id: h.id,
            raw_sold: totalSold,
            raw_revenue: totalRev,
            raw_payout: totalPayout,
            raw_balance: h.balance || 0,
            isZeroSales: totalSold === 0
          };
        });

        if (rows.length > 0) {
          const sumSold = rows.reduce((sum, r) => sum + r.raw_sold, 0);
          const sumRevenue = rows.reduce((sum, r) => sum + r.raw_revenue, 0);
          const sumPayout = rows.reduce((sum, r) => sum + r.raw_payout, 0);
          const sumBalance = rows.reduce((sum, r) => sum + r.raw_balance, 0);

          totalsRow = {
            id: 'TOTAL',
            name: `${rows.length} Hawkers`,
            route: '—',
            status: '—',
            sold: sumSold,
            revenue: formatCurrency(sumRevenue),
            payout: formatCurrency(sumPayout),
            balance: formatCurrency(sumBalance),
            isTotal: true
          };

          summaryLine = `Total Hawker Sales: ${formatCurrency(sumRevenue)} across ${rows.length} ${rows.length === 1 ? 'hawker' : 'hawkers'}`;
          summaryStats = [
            { label: 'Units Sold', value: sumSold },
            { label: 'Hawker Payouts', value: formatCurrency(sumPayout) },
            { label: 'Outstanding Balance', value: formatCurrency(sumBalance) }
          ];
        }
      }

      // 5. INVENTORY & STOCK CATALOG REPORT
      else if (reportId === 'inventory_report') {
        title = `Inventory & Stock Catalog Report`;
        filterLabel = `Current Warehouse & Van Stock`;
        emptyMessage = `No inventory items found.`;

        columns = [
          { header: 'ID', key: 'id' },
          { header: 'Product Name', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Barcode', key: 'barcode' },
          { header: 'Base Cost', key: 'cost' },
          { header: 'Selling Price', key: 'price' },
          { header: 'Current Stock', key: 'stock' },
          { header: 'Stock Alert', key: 'alert' },
          { header: 'Expiry Date', key: 'expiry' }
        ];

        rows = products.map(p => ({
          id: `#${p.id}`,
          name: p.name,
          category: p.category || 'General',
          barcode: p.barcode || '-',
          cost: formatCurrency(p.base_cost),
          price: formatCurrency(p.selling_price),
          stock: p.current_stock,
          alert: p.current_stock <= (p.min_stock_alert || 10) ? 'LOW STOCK' : 'IN STOCK',
          expiry: p.expiry_date || 'N/A',
          raw_id: p.id,
          raw_cost: p.base_cost || 0,
          raw_price: p.selling_price || 0,
          raw_stock: p.current_stock || 0
        }));

        if (rows.length > 0) {
          const sumStock = rows.reduce((sum, r) => sum + r.raw_stock, 0);
          const lowStockCount = rows.filter(r => r.alert === 'LOW STOCK').length;

          totalsRow = {
            id: 'TOTAL',
            name: `${rows.length} Products`,
            category: '—',
            barcode: '—',
            cost: '—',
            price: '—',
            stock: sumStock,
            alert: `${lowStockCount} Low Stock`,
            expiry: '—',
            isTotal: true
          };

          summaryLine = `Total Warehouse Stock: ${sumStock} units across ${rows.length} products`;
          summaryStats = [
            { label: 'Low Stock Alerts', value: lowStockCount }
          ];
        }
      }

      // 6. RETURNS & DAMAGED PRODUCTS REPORT
      else if (reportId === 'returns_report') {
        title = `Evening Returns & Damaged Products Report`;
        filterLabel = `Unsold Returns & Damage Ledger`;
        emptyMessage = `No returns or damage logs recorded yet.`;

        columns = [
          { header: 'Date', key: 'date' },
          { header: 'Hawker', key: 'hawker' },
          { header: 'Product', key: 'product' },
          { header: 'Dispatched', key: 'dispatched' },
          { header: 'Returned Unsold', key: 'returned' },
          { header: 'Damaged Qty', key: 'damaged' },
          { header: 'Sold Qty', key: 'sold' },
          { header: 'Remarks', key: 'remarks' },
          { header: 'Cash Collected', key: 'cash' }
        ];

        const returnLogs = logs.filter(l => l.returned_qty > 0 || l.damaged_qty > 0 || l.cash_collected > 0);
        rows = returnLogs.map(log => {
          const h = hawkers.find(x => x.id === log.hawker_id) || { name: `Hawker #${log.hawker_id}` };
          const p = products.find(x => x.id === log.product_id) || { name: `Product #${log.product_id}` };

          return {
            date: log.date,
            hawker: h.name,
            product: p.name,
            dispatched: log.dispatched_qty,
            returned: log.returned_qty,
            damaged: log.damaged_qty || 0,
            sold: log.sold_qty,
            remarks: log.remarks || '-',
            cash: formatCurrency(log.cash_collected),
            raw_dispatched: log.dispatched_qty || 0,
            raw_returned: log.returned_qty || 0,
            raw_damaged: log.damaged_qty || 0,
            raw_sold: log.sold_qty || 0,
            raw_cash: log.cash_collected || 0
          };
        });

        if (rows.length > 0) {
          const sumDispatched = rows.reduce((sum, r) => sum + r.raw_dispatched, 0);
          const sumReturned = rows.reduce((sum, r) => sum + r.raw_returned, 0);
          const sumDamaged = rows.reduce((sum, r) => sum + r.raw_damaged, 0);
          const sumSold = rows.reduce((sum, r) => sum + r.raw_sold, 0);
          const sumCash = rows.reduce((sum, r) => sum + r.raw_cash, 0);

          totalsRow = {
            date: 'TOTAL',
            hawker: '—',
            product: `${rows.length} Logs`,
            dispatched: sumDispatched,
            returned: sumReturned,
            damaged: sumDamaged,
            sold: sumSold,
            remarks: '—',
            cash: formatCurrency(sumCash),
            isTotal: true
          };

          summaryLine = `Total Evening Returns: ${sumReturned} returned, ${sumDamaged} damaged across ${rows.length} logs`;
          summaryStats = [
            { label: 'Cash Collected', value: formatCurrency(sumCash) }
          ];
        }
      }

      // 7. PROFIT & LOSS ANALYSIS REPORT
      else if (reportId === 'profit_report') {
        title = `Profit & Loss Analysis Report`;
        filterLabel = `Cumulative Financial Overview`;
        emptyMessage = `No financial activity recorded yet.`;

        columns = [
          { header: 'Item / Category', key: 'item' },
          { header: 'Type', key: 'type' },
          { header: 'Gross Sales / Amount', key: 'amount' },
          { header: 'COGS / Cost', key: 'cogs' },
          { header: 'Commissions / Payout', key: 'payout' },
          { header: 'Net Profit', key: 'profit' }
        ];

        // Summarize sales profit & expenses
        const totalGross = logs.reduce((sum, l) => sum + (l.gross_revenue || 0), 0);
        const totalPayout = logs.reduce((sum, l) => sum + (l.hawker_payout || 0), 0);
        const totalSalesProfit = logs.reduce((sum, l) => sum + (l.net_profit || 0), 0);
        const totalCogs = totalGross - (totalSalesProfit + totalPayout);
        const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        rows = [
          {
            item: 'Total Product Sales (Cumulative)',
            type: 'Revenue Stream',
            amount: formatCurrency(totalGross),
            cogs: formatCurrency(totalCogs),
            payout: formatCurrency(totalPayout),
            profit: formatCurrency(totalSalesProfit),
            raw_amount: totalGross,
            raw_cogs: totalCogs,
            raw_payout: totalPayout,
            raw_profit: totalSalesProfit
          },
          {
            item: 'Operational Expenses (Total)',
            type: 'Operational Expense',
            amount: formatCurrency(totalExp),
            cogs: '—',
            payout: '—',
            profit: formatCurrency(-totalExp),
            raw_amount: totalExp,
            raw_cogs: 0,
            raw_payout: 0,
            raw_profit: -totalExp
          },
          {
            item: 'OVERALL NET SYSTEM PROFIT',
            type: 'Net Performance',
            amount: formatCurrency(totalGross),
            cogs: formatCurrency(totalCogs),
            payout: formatCurrency(totalPayout),
            profit: formatCurrency(totalSalesProfit - totalExp),
            raw_amount: totalGross,
            raw_cogs: totalCogs,
            raw_payout: totalPayout,
            raw_profit: totalSalesProfit - totalExp,
            isHighlight: true
          }
        ];

        summaryLine = `Overall Net System Profit: ${formatCurrency(totalSalesProfit - totalExp)}`;
        summaryStats = [
          { label: 'Gross Sales', value: formatCurrency(totalGross) },
          { label: 'Expenses', value: formatCurrency(totalExp) }
        ];
      }

      // 8. COLLECTIONS LEDGER REPORT
      else if (reportId === 'collection_report') {
        title = `Hawker Collections Ledger Report`;
        filterLabel = `Collections & Evening Settlements`;
        emptyMessage = `No collection transactions recorded.`;

        columns = [
          { header: 'Ref ID', key: 'id' },
          { header: 'Date', key: 'date' },
          { header: 'Hawker Name', key: 'hawker' },
          { header: 'Payment Method', key: 'method' },
          { header: 'Source / Type', key: 'type' },
          { header: 'Amount Collected', key: 'amount' }
        ];

        const list1 = collections.map(c => {
          const h = hawkers.find(x => x.id === c.hawker_id) || { name: `Hawker #${c.hawker_id}` };
          return {
            id: `COL-${c.id}`,
            date: c.date,
            hawker: h.name,
            method: c.payment_method || 'Cash',
            type: c.is_edited ? `Direct Collection (Edited${c.original_amount ? `, orig ₹${c.original_amount.toFixed(2)}` : ''})` : 'Direct Collection',
            amount: formatCurrency(c.amount),
            raw_amount: c.amount || 0
          };
        });

        const list2 = logs.filter(l => l.cash_collected > 0).map(l => {
          const h = hawkers.find(x => x.id === l.hawker_id) || { name: `Hawker #${l.hawker_id}` };
          return {
            id: `SETTLE-${l.id}`,
            date: l.date,
            hawker: h.name,
            method: 'Cash Settlement',
            type: 'Evening Return Settlement',
            amount: formatCurrency(l.cash_collected),
            raw_amount: l.cash_collected || 0
          };
        });

        rows = [...list1, ...list2].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (rows.length > 0) {
          const sumAmount = rows.reduce((sum, r) => sum + r.raw_amount, 0);
          totalsRow = {
            id: 'TOTAL',
            date: '—',
            hawker: '—',
            method: '—',
            type: `${rows.length} Collections`,
            amount: formatCurrency(sumAmount),
            isTotal: true
          };

          summaryLine = `Total Collections: ${formatCurrency(sumAmount)} across ${rows.length} transactions`;
          summaryStats = [
            { label: 'Settlement Count', value: rows.length }
          ];
        }
      }

      setLoading(false);
      return { reportId, title, filterLabel, emptyMessage, columns, rows, totalsRow, summaryLine, summaryStats };
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert('Failed to generate report data');
      return null;
    }
  };

  // Export to Excel with Totals Row & Summary
  const handleExportExcel = async (reportId) => {
    setLoading(true);
    setLoadingReportId(reportId);
    const data = await fetchReportData(reportId);
    setLoading(false);
    setLoadingReportId(null);
    if (!data) return;

    const wsData = [
      [data.title],
      [`Filter: ${data.filterLabel}`],
      ...(data.summaryLine ? [[data.summaryLine]] : []),
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      data.columns.map(c => c.header),
      ...data.rows.map(r => data.columns.map(c => r[c.key])),
      ...(data.totalsRow ? [
        [], // empty separator row
        data.columns.map(c => (data.totalsRow[c.key] !== undefined && data.totalsRow[c.key] !== null ? data.totalsRow[c.key] : ''))
      ] : [])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    worksheet['!cols'] = data.columns.map(c => ({
      wch: Math.max(c.header.length + 4, 15)
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // Export to PDF with Totals Row & Summary
  const handleExportPDF = async (reportId) => {
    setLoading(true);
    setLoadingReportId(reportId);
    const data = await fetchReportData(reportId);
    setLoading(false);
    setLoadingReportId(null);
    if (!data) return;

    const isLandscape = data.columns.length > 7;
    const doc = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait' });
    const pageWidth = isLandscape ? 297 : 210;
    
    // Header Banner
    doc.setFillColor(24, 56, 51); // Dark green brand header
    doc.rect(0, 0, pageWidth, 28, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title.toUpperCase(), 14, 13);
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filter: ${data.filterLabel}  |  Generated on: ${new Date().toLocaleString()}  |  IMS Business Intelligence`, 14, 21);

    const marginX = 10;
    const tableWidth = pageWidth - (marginX * 2);
    let y = 35;

    // Summary Highlight Callout in PDF
    if (data.summaryLine) {
      doc.setFillColor(45, 212, 191);
      doc.rect(marginX, y, tableWidth, 0.75, 'F');
      doc.setFillColor(236, 246, 244);
      doc.rect(marginX, y + 0.75, tableWidth, 8.5, 'F');
      doc.setTextColor(19, 78, 74);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(data.summaryLine, marginX + 3, y + 6.5);
      y += 15;
    } else {
      y += 3;
    }

    doc.setFontSize(8);
    const colWidth = tableWidth / data.columns.length;

    // Header row
    doc.setFillColor(236, 246, 244);
    doc.rect(marginX, y - 5, tableWidth, 8, 'F');
    doc.setTextColor(24, 56, 51);
    doc.setFont('helvetica', 'bold');
    
    data.columns.forEach((col, i) => {
      const headerText = col.header.length > 15 ? col.header.substring(0, 14) + '..' : col.header;
      doc.text(headerText, marginX + 2 + (i * colWidth), y);
    });

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 50, 60);

    data.rows.forEach((row, rowIndex) => {
      if (y > (isLandscape ? 190 : 275)) {
        doc.addPage();
        y = 20;
      }

      // Zebra striping
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 250);
        doc.rect(marginX, y - 5, tableWidth, 7, 'F');
      }

      data.columns.forEach((col, i) => {
        const textVal = String(row[col.key] ?? '-');
        const safeText = textVal.length > 17 ? textVal.substring(0, 16) + '.' : textVal;
        doc.text(safeText, marginX + 2 + (i * colWidth), y);
      });

      y += 7;
    });

    // Totals Row in PDF
    if (data.totalsRow) {
      if (y > (isLandscape ? 185 : 270)) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(216, 238, 233);
      doc.rect(marginX, y - 5, tableWidth, 8.5, 'F');
      doc.setTextColor(19, 78, 74);
      doc.setFont('helvetica', 'bold');
      data.columns.forEach((col, i) => {
        const rawVal = data.totalsRow[col.key];
        const textVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
        const safeText = textVal.length > 17 ? textVal.substring(0, 16) + '.' : textVal;
        doc.text(safeText, marginX + 2 + (i * colWidth), y);
      });
      y += 8.5;
    }

    doc.save(`${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // Preview Data Handler
  const handlePreview = async (reportId) => {
    setLoadingReportId(reportId);
    const data = await fetchReportData(reportId);
    setLoadingReportId(null);
    if (data) {
      setPreviewModal(data);
      // Sensible default sort per report
      if (reportId === 'product_sales') {
        setSortColumn('revenue');
        setSortDirection('desc');
      } else if (reportId === 'daily_sales') {
        setSortColumn('sold');
        setSortDirection('desc');
      } else if (reportId === 'monthly_sales') {
        setSortColumn('date');
        setSortDirection('asc');
      } else if (reportId === 'hawker_performance') {
        setSortColumn('revenue');
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    }
  };

  // Column Header Sort Click Handler
  const handleSort = (key) => {
    if (sortColumn === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection(isNumericKey(key) ? 'desc' : 'asc');
    }
  };

  // Sorted Rows
  const sortedRows = useMemo(() => {
    if (!previewModal?.rows) return [];
    if (!sortColumn) return previewModal.rows;

    return [...previewModal.rows].sort((a, b) => {
      const rawKey = `raw_${sortColumn}`;
      const valA = a[rawKey] !== undefined ? a[rawKey] : a[sortColumn];
      const valB = b[rawKey] !== undefined ? b[rawKey] : b[sortColumn];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        const cleanA = String(valA).replace(/[₹,%]/g, '').trim();
        const cleanB = String(valB).replace(/[₹,%]/g, '').trim();
        const numA = Number(cleanA);
        const numB = Number(cleanB);
        if (!isNaN(numA) && !isNaN(numB) && cleanA !== '' && cleanB !== '') {
          comparison = numA - numB;
        } else {
          comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        }
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [previewModal?.rows, sortColumn, sortDirection]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Business Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Generate, preview, and download 8 comprehensive operational & financial reports in PDF and Excel.
          </p>
        </div>
      </div>

      {/* Date & Filter Controls Panel */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--accent-color)" /> Report Date & Time Filters
        </h3>

        <div className="grid-cols-3" style={{ display: 'grid', gap: '1.5rem', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Specific Date (Daily Reports)</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Target Month (Monthly Reports)</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Target Year</label>
            <input type="number" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} />
          </div>
        </div>
      </div>

      {/* 8 Required Reports Cards Grid */}
      <div className="grid-cols-2" style={{ display: 'grid', gap: '1.5rem' }}>
        {reportsConfig.map((rep) => {
          const isCurrentLoading = loading && loadingReportId === rep.id;

          return (
            <div key={rep.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{rep.icon}</span> {rep.name}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  {rep.desc}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={loading}
                  style={{ flex: 1, padding: '0.55rem 0.6rem', fontSize: '0.85rem' }} 
                  onClick={() => handlePreview(rep.id)}
                >
                  {isCurrentLoading ? <RefreshCw size={14} className="spin" /> : <Eye size={14} />} 
                  {isCurrentLoading ? 'Loading...' : 'Preview Data'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  disabled={loading}
                  style={{ flex: 1, padding: '0.55rem 0.6rem', fontSize: '0.85rem', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }} 
                  onClick={() => handleExportPDF(rep.id)}
                >
                  <Download size={14} /> PDF Report
                </button>
                <button 
                  className="btn btn-success" 
                  disabled={loading}
                  style={{ flex: 1, padding: '0.55rem 0.6rem', fontSize: '0.85rem' }} 
                  onClick={() => handleExportExcel(rep.id)}
                >
                  <FileSpreadsheet size={14} /> Excel (.xlsx)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Preview Modal */}
      {previewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{ 
            maxWidth: '1200px', 
            width: '95vw', 
            border: '1.5px solid var(--accent-color)', 
            position: 'relative', 
            maxHeight: '90vh', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            borderRadius: '16px'
          }}>
            <button 
              onClick={() => setPreviewModal(null)} 
              title="Close Preview"
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 20 }}
            >
              <X size={22} />
            </button>

            {/* Modal Header */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem', paddingRight: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText color="var(--accent-color)" size={22}/> Preview: {previewModal.title}
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <span className="badge info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.2rem 0.65rem' }}>
                  <Calendar size={13} /> Showing data for: <strong>{previewModal.filterLabel}</strong>
                </span>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  • Showing {previewModal.rows.length} {previewModal.rows.length === 1 ? 'record' : 'records'} prepared for download
                </span>
                {sortColumn && (
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    Sorted by: <strong>{previewModal.columns.find(c => c.key === sortColumn)?.header || sortColumn}</strong> ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
                  </span>
                )}
              </div>

              {/* Quick Summary Line at top of modal */}
              {previewModal.summaryLine && previewModal.rows.length > 0 && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 1rem',
                  background: 'linear-gradient(90deg, #E6F4F1 0%, #F0FDF4 100%)',
                  border: '1.5px solid #2DD4BF',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--accent-color)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem'
                    }}>
                      ₹
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.975rem', color: '#134E4A' }}>
                      {previewModal.summaryLine}
                    </span>
                  </div>
                  {previewModal.summaryStats && previewModal.summaryStats.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {previewModal.summaryStats.map((st, i) => (
                        <span 
                          key={i} 
                          style={{
                            fontSize: '0.775rem',
                            color: '#0F766E',
                            background: '#FFFFFF',
                            border: '1px solid #99F6E4',
                            borderRadius: '6px',
                            padding: '0.2rem 0.55rem',
                            fontWeight: 600
                          }}
                        >
                          {st.label}: <strong style={{ color: '#134E4A' }}>{st.value}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Table Content */}
            {sortedRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ padding: '1rem', borderRadius: '50%', background: '#F1F5F9', marginBottom: '1rem' }}>
                  <Calendar size={36} color="var(--accent-color)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  No records found
                </div>
                <p style={{ maxWidth: '440px', margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {previewModal.emptyMessage || `No data matches the selected filter (${previewModal.filterLabel}). Try adjusting the date, month, or year filter above.`}
                </p>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1, maxHeight: '60vh', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ margin: 0, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      {previewModal.columns.map(col => {
                        const isNum = isNumericKey(col.key);
                        const isCurrentSort = sortColumn === col.key;

                        return (
                          <th 
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            title={`Click to sort by ${col.header}`}
                            style={{ 
                              position: 'sticky', 
                              top: 0, 
                              background: '#F0F7F6', 
                              zIndex: 10,
                              cursor: 'pointer',
                              userSelect: 'none',
                              whiteSpace: 'nowrap',
                              padding: '0.75rem 0.85rem',
                              borderBottom: '2px solid var(--border-color)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                              textAlign: isNum ? 'right' : 'left'
                            }}
                          >
                            <div style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.35rem', 
                              justifyContent: isNum ? 'flex-end' : 'flex-start',
                              width: '100%'
                            }}>
                              <span>{col.header}</span>
                              {isCurrentSort ? (
                                sortDirection === 'asc' ? <ArrowUp size={13} color="var(--accent-color)" /> : <ArrowDown size={13} color="var(--accent-color)" />
                              ) : (
                                <ArrowUpDown size={12} style={{ opacity: 0.3 }} />
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {sortedRows.map((row, idx) => {
                      const isZero = row.isZeroSales;

                      return (
                        <tr 
                          key={idx}
                          style={{ 
                            backgroundColor: row.isHighlight ? 'rgba(45, 212, 191, 0.12)' : isZero ? 'rgba(241, 245, 249, 0.55)' : (idx % 2 === 0 ? '#FFFFFF' : '#FAFCFB'),
                            color: isZero ? '#94A3B8' : 'inherit',
                            fontWeight: row.isHighlight ? 700 : 400
                          }}
                        >
                          {previewModal.columns.map(col => {
                            const isNum = isNumericKey(col.key);

                            return (
                              <td 
                                key={col.key} 
                                style={{ 
                                  padding: '0.65rem 0.85rem',
                                  whiteSpace: 'nowrap',
                                  textAlign: isNum ? 'right' : 'left',
                                  fontWeight: (col.key.includes('revenue') || col.key.includes('profit') || col.key === 'sold') ? 700 : 400,
                                  color: isZero && (col.key === 'sold' || col.key.includes('revenue')) ? '#94A3B8' : undefined
                                }}
                              >
                                {col.key === 'sold' && isZero ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                    <span>0</span>
                                    <span className="badge" style={{ 
                                      background: '#F1F5F9', 
                                      color: '#64748B', 
                                      fontSize: '0.675rem', 
                                      padding: '0.12rem 0.4rem', 
                                      borderRadius: '4px',
                                      border: '1px solid #E2E8F0',
                                      fontWeight: 600
                                    }}>
                                      No sales
                                    </span>
                                  </span>
                                ) : col.key === 'margin' && !isZero ? (
                                  <span style={{ 
                                    color: (row.raw_margin || 0) > 20 ? 'var(--success-color)' : (row.raw_margin || 0) > 0 ? 'var(--warning-color)' : 'var(--danger-color)',
                                    fontWeight: 700 
                                  }}>
                                    {row[col.key]}
                                  </span>
                                ) : (
                                  row[col.key]
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Sticky Summary / Totals Row */}
                  {previewModal.totalsRow && sortedRows.length > 0 && (
                    <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 9 }}>
                      <tr style={{ 
                        background: '#D4EDE8', 
                        borderTop: '2.5px solid var(--accent-color)', 
                        fontWeight: 800,
                        color: 'var(--text-primary)' 
                      }}>
                        {previewModal.columns.map(col => {
                          const isNum = isNumericKey(col.key);
                          const isKeyRevenue = col.key === 'revenue';

                          return (
                            <td 
                              key={col.key}
                              style={{ 
                                position: 'sticky',
                                bottom: 0,
                                background: '#D4EDE8',
                                padding: '0.75rem 0.85rem',
                                whiteSpace: 'nowrap',
                                textAlign: isNum ? 'right' : 'left',
                                fontWeight: isKeyRevenue ? 900 : 800,
                                fontSize: isKeyRevenue ? '0.925rem' : '0.875rem',
                                color: isKeyRevenue ? '#0D5B52' : 'var(--text-primary)',
                                borderTop: '2.5px solid var(--accent-color)',
                                boxShadow: '0 -4px 8px rgba(0,0,0,0.08)'
                              }}
                            >
                              {previewModal.totalsRow[col.key] !== undefined && previewModal.totalsRow[col.key] !== null 
                                ? previewModal.totalsRow[col.key] 
                                : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                  onClick={() => handleExportPDF(previewModal.reportId)}
                >
                  <Download size={14} /> Export PDF
                </button>
                <button 
                  className="btn btn-success" 
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                  onClick={() => handleExportExcel(previewModal.reportId)}
                >
                  <FileSpreadsheet size={14} /> Export Excel (.xlsx)
                </button>
              </div>

              <button className="btn btn-secondary" onClick={() => setPreviewModal(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
