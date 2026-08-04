import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FileText, FileSpreadsheet, Download, Eye, Calendar, Filter, X, RefreshCw, Layers } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState(null); // { title, columns, rows }

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
      desc: "Sales volume, gross revenue, cost of goods, and net margin performance per product.",
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
      let columns = [];
      let rows = [];

      if (reportId === 'daily_sales') {
        title = `Daily Sales Report (${selectedDate})`;
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
            price: `₹${p.selling_price.toFixed(2)}`,
            revenue: `₹${log.gross_revenue.toFixed(2)}`
          };
        });
      }

      else if (reportId === 'monthly_sales') {
        title = `Monthly Sales Report (${selectedMonth}/${selectedYear})`;
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
          revenue: `₹${g.revenue.toFixed(2)}`,
          payout: `₹${g.payout.toFixed(2)}`,
          profit: `₹${g.profit.toFixed(2)}`
        }));
      }

      else if (reportId === 'product_sales') {
        title = `Product-wise Sales Report`;
        columns = [
          { header: 'Product ID', key: 'id' },
          { header: 'Product Name', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Base Cost', key: 'cost' },
          { header: 'Selling Price', key: 'price' },
          { header: 'Current Stock', key: 'stock' },
          { header: 'Units Sold', key: 'sold' },
          { header: 'Gross Revenue', key: 'revenue' },
          { header: 'Net Profit', key: 'profit' }
        ];

        rows = products.map(p => {
          const pLogs = logs.filter(l => l.product_id === p.id);
          const totalSold = pLogs.reduce((sum, l) => sum + (l.sold_qty || 0), 0);
          const totalRev = pLogs.reduce((sum, l) => sum + (l.gross_revenue || 0), 0);
          const totalProfit = pLogs.reduce((sum, l) => sum + (l.net_profit || 0), 0);

          return {
            id: `#${p.id}`,
            name: p.name,
            category: p.category || 'General',
            cost: `₹${p.base_cost.toFixed(2)}`,
            price: `₹${p.selling_price.toFixed(2)}`,
            stock: p.current_stock,
            sold: totalSold,
            revenue: `₹${totalRev.toFixed(2)}`,
            profit: `₹${totalProfit.toFixed(2)}`
          };
        });
      }

      else if (reportId === 'hawker_performance') {
        title = `Hawker Performance Report`;
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
            revenue: `₹${totalRev.toFixed(2)}`,
            payout: `₹${totalPayout.toFixed(2)}`,
            balance: `₹${h.balance.toFixed(2)}`
          };
        });
      }

      else if (reportId === 'inventory_report') {
        title = `Inventory & Stock Catalog Report`;
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
          cost: `₹${p.base_cost.toFixed(2)}`,
          price: `₹${p.selling_price.toFixed(2)}`,
          stock: p.current_stock,
          alert: p.current_stock <= p.min_stock_alert ? 'LOW STOCK' : 'IN STOCK',
          expiry: p.expiry_date || 'N/A'
        }));
      }

      else if (reportId === 'returns_report') {
        title = `Evening Returns & Damaged Products Report`;
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
            cash: `₹${log.cash_collected.toFixed(2)}`
          };
        });
      }

      else if (reportId === 'profit_report') {
        title = `Profit & Loss Analysis Report`;
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
            amount: `₹${totalGross.toFixed(2)}`,
            cogs: `₹${totalCogs.toFixed(2)}`,
            payout: `₹${totalPayout.toFixed(2)}`,
            profit: `₹${totalSalesProfit.toFixed(2)}`
          },
          {
            item: 'Operational Expenses (Total)',
            type: 'Operational Expense',
            amount: `₹${totalExp.toFixed(2)}`,
            cogs: '-',
            payout: '-',
            profit: `-₹${totalExp.toFixed(2)}`
          },
          {
            item: 'OVERALL NET SYSTEM PROFIT',
            type: 'Net Performance',
            amount: `₹${totalGross.toFixed(2)}`,
            cogs: `₹${totalCogs.toFixed(2)}`,
            payout: `₹${totalPayout.toFixed(2)}`,
            profit: `₹${(totalSalesProfit - totalExp).toFixed(2)}`
          }
        ];
      }

      else if (reportId === 'collection_report') {
        title = `Hawker Collections Ledger Report`;
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
            type: 'Direct Collection',
            amount: `₹${c.amount.toFixed(2)}`
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
            amount: `₹${l.cash_collected.toFixed(2)}`
          };
        });

        rows = [...list1, ...list2].sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      setLoading(false);
      return { title, columns, rows };
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert('Failed to generate report data');
      return null;
    }
  };

  // Export Handlers
  const handleExportExcel = async (reportId) => {
    const data = await fetchReportData(reportId);
    if (!data) return;

    const wsData = [
      [data.title],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      data.columns.map(c => c.header),
      ...data.rows.map(r => data.columns.map(c => r[c.key]))
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const handleExportPDF = async (reportId) => {
    const data = await fetchReportData(reportId);
    if (!data) return;

    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(30, 41, 59); // Dark blue header background
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title.toUpperCase(), 14, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()} | Inventory Management System`, 14, 25);

    // Table Content
    let y = 40;
    doc.setFontSize(9);

    // Header row
    doc.setFillColor(241, 245, 249);
    doc.rect(10, y - 5, 190, 8, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    
    const colWidth = 190 / data.columns.length;
    data.columns.forEach((col, i) => {
      doc.text(col.header.substring(0, 12), 12 + (i * colWidth), y);
    });

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    data.rows.forEach((row, rowIndex) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      // Zebra striping
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y - 5, 190, 7, 'F');
      }

      data.columns.forEach((col, i) => {
        const textVal = String(row[col.key] || '-');
        doc.text(textVal.substring(0, 14), 12 + (i * colWidth), y);
      });

      y += 7;
    });

    doc.save(`${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const handlePreview = async (reportId) => {
    const data = await fetchReportData(reportId);
    if (data) {
      setPreviewModal(data);
    }
  };

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
        {reportsConfig.map((rep) => (
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
                style={{ flex: 1, padding: '0.5rem 0.6rem', fontSize: '0.85rem' }} 
                onClick={() => handlePreview(rep.id)}
              >
                <Eye size={14} /> Preview Data
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.5rem 0.6rem', fontSize: '0.85rem', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }} 
                onClick={() => handleExportPDF(rep.id)}
              >
                <Download size={14} /> PDF Report
              </button>
              <button 
                className="btn btn-success" 
                style={{ flex: 1, padding: '0.5rem 0.6rem', fontSize: '0.85rem' }} 
                onClick={() => handleExportExcel(rep.id)}
              >
                <FileSpreadsheet size={14} /> Excel (.xlsx)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Data Preview Modal */}
      {previewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{ maxWidth: '900px', width: '100%', border: '1px solid var(--accent-color)', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setPreviewModal(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText color="var(--accent-color)" size={22}/> Preview: {previewModal.title}
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Showing {previewModal.rows.length} records prepared for download.
              </p>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table>
                <thead>
                  <tr>
                    {previewModal.columns.map(col => (
                      <th key={col.key}>{col.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewModal.rows.map((row, idx) => (
                    <tr key={idx}>
                      {previewModal.columns.map(col => (
                        <td key={col.key} style={{ fontWeight: col.key.includes('revenue') || col.key.includes('profit') ? 600 : 400 }}>
                          {row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {previewModal.rows.length === 0 && (
                    <tr>
                      <td colSpan={previewModal.columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No data available for the selected report filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
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
