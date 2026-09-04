import { NextResponse } from "next/server";
import { getSupplierPaymentReceiptById } from "@/modules/finance/supplier-payment.service";
import Handlebars from "handlebars";

const voucherTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Voucher - {{paymentNumber}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { margin: 12mm; size: A4 portrait; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .voucher-card {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-b: 2px solid #2872F0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #2872F0;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    
    .brand-sub {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    
    .voucher-badge {
      text-align: right;
    }
    
    .badge-title {
      display: inline-block;
      background: #EAF2FF;
      color: #2872F0;
      font-size: 12px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .voucher-no {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 6px;
    }
    
    /* Grid details */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 18px;
    }
    
    .info-block label {
      display: block;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .info-block p {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }

    .info-block span {
      font-size: 12px;
      color: #475569;
      font-weight: 500;
    }

    /* Paid Amount Banner */
    .amount-banner {
      background: linear-gradient(135deg, #2872F0 0%, #0A3D8F 100%);
      color: #ffffff;
      border-radius: 14px;
      padding: 22px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      box-shadow: 0 4px 14px rgba(40, 114, 240, 0.25);
    }
    
    .amount-label {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
    }

    .amount-sub {
      font-size: 11px;
      opacity: 0.8;
      margin-top: 2px;
    }
    
    .amount-val {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    
    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
    }
    
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      color: #1e293b;
    }

    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }

    /* Notes */
    .notes-box {
      background: #fffbe0;
      border: 1px solid #fde047;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 12px;
      color: #713f12;
      margin-bottom: 36px;
    }
    
    /* Signature block */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      margin-top: 48px;
      padding-top: 20px;
    }
    
    .sig-box {
      text-align: center;
    }
    
    .sig-line {
      border-bottom: 1.5px dashed #94a3b8;
      height: 40px;
      margin-bottom: 8px;
    }
    
    .sig-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }

    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 36px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
  </style>
</head>
<body onload="window.print()">
  <div class="voucher-card">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">Eheliyagoda Pharmacy</div>
        <div class="brand-sub">Official Supplier Remittance Advice</div>
      </div>
      <div class="voucher-badge">
        <span class="badge-title">Payment Voucher</span>
        <div class="voucher-no">{{paymentNumber}}</div>
      </div>
    </div>
    
    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-block">
        <label>Supplier Name</label>
        <p>{{supplierName}}</p>
        {{#if supplierPhone}}<span>Tel: {{supplierPhone}}</span>{{/if}}
      </div>
      <div class="info-block text-right">
        <label>Payment Date &amp; Time</label>
        <p>{{paidAtFormatted}}</p>
        <span>Recorded by: {{createdBy}}</span>
      </div>
    </div>
    
    <!-- Amount Banner -->
    <div class="amount-banner">
      <div>
        <div class="amount-label">Amount Paid</div>
        <div class="amount-sub">Paid via {{paymentMethod}}{{#if reference}} (Ref: {{reference}}){{/if}}</div>
      </div>
      <div class="amount-val">LKR {{amount}}</div>
    </div>
    
    <!-- Breakdown Table -->
    <table>
      <thead>
        <tr>
          <th>Invoice No.</th>
          <th>Original Invoice Total</th>
          <th>Total Paid</th>
          <th class="text-right">Remaining Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="font-bold">{{invoiceNumber}}</td>
          <td>LKR {{invoiceTotal}}</td>
          <td class="font-bold" style="color: #166534">LKR {{amount}}</td>
          <td class="text-right font-bold" style="color: #991b1b">LKR {{outstandingAfter}}</td>
        </tr>
      </tbody>
    </table>
    
    {{#if notes}}
    <div class="notes-box">
      <strong>Notes / Remarks:</strong> {{notes}}
    </div>
    {{/if}}
    
    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">Prepared By</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">Authorized Signature</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">Supplier Signature</div>
      </div>
    </div>
    
    <div class="footer-note">
      This payment voucher serves as an official proof of payment issued by Eheliyagoda Pharmacy.
    </div>
  </div>
</body>
</html>
`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await getSupplierPaymentReceiptById(id);

    if (!payment) {
      return new NextResponse("Supplier payment record not found", { status: 404 });
    }

    const dateObj = new Date(payment.paidAt);
    const paidAtFormatted = isNaN(dateObj.getTime())
      ? payment.paidAt
      : dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

    const template = Handlebars.compile(voucherTemplate);
    const html = template({
      ...payment,
      paidAtFormatted,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("[Supplier Payment Print Error]:", error);
    return new NextResponse("Failed to render supplier payment voucher", { status: 500 });
  }
}
