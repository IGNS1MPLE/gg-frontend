import React from 'react';
import { api } from '../api';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export default function Reports() {
  
  const generatePDF = async (reportName, endpoint) => {
    try {
      // In a real app, we'd fetch data and format it nicely into a PDF using autoTable
      // For now we'll just download a basic PDF to demonstrate the functionality
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(`AntiGravity - ${reportName}`, 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
      
      const data = await api.get(endpoint);
      
      let y = 50;
      doc.setFontSize(10);
      
      if (Array.isArray(data)) {
        data.slice(0, 40).forEach((item, index) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(JSON.stringify(item).substring(0, 100), 14, y);
          y += 7;
        });
      } else {
        doc.text(JSON.stringify(data), 14, y);
      }
      
      doc.save(`${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    }
  };

  const generateExcel = async (reportName, endpoint) => {
    try {
      const data = await api.get(endpoint);
      const worksheet = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate Excel');
    }
  };

  const reportsList = [
    { name: "Daily Sales Report", desc: "All dispatches and returns for the current day.", endpoint: "/logs/" },
    { name: "Hawker Performance Report", desc: "Ranking and total revenue by hawker.", endpoint: `/analytics/top-hawkers?month=${new Date().getMonth()+1}&year=${new Date().getFullYear()}` },
    { name: "Inventory Report", desc: "Current stock levels and minimum stock alerts.", endpoint: "/products/" },
    { name: "Returns Report", desc: "Pending and completed returns with sold quantity calculation.", endpoint: "/logs/" },
    { name: "Profit & Loss Report", desc: "Revenue minus base cost and hawker commissions.", endpoint: `/analytics/top-products?month=${new Date().getMonth()+1}&year=${new Date().getFullYear()}` },
    { name: "Collection Report", desc: "All payments collected from hawkers.", endpoint: "/collections/" },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports & Exports</h1>
        <div style={{ color: 'var(--text-secondary)' }}>Generate and download system reports</div>
      </div>

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        {reportsList.map((report, index) => (
          <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--accent-color)" /> {report.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{report.desc}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => generatePDF(report.name, report.endpoint)}>
                <Download size={16} /> Export PDF
              </button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={() => generateExcel(report.name, report.endpoint)}>
                <FileSpreadsheet size={16} /> Export Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
