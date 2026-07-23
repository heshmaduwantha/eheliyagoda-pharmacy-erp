import { NextResponse } from "next/server";
import { getSaleReceiptById } from "@/modules/sales/sale.service";
import Handlebars from "handlebars";

const receiptTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - {{saleNumber}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: 80mm auto; }
    body {
      font-family: 'Inter', sans-serif;
      width: 80mm;
      margin: 0;
      padding: 5mm;
      box-sizing: border-box;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: 600; }
    .text-black { font-weight: 800; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .divider-thick { border-top: 2px solid #000; margin: 8px 0; }
    
    .header { margin-bottom: 12px; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 2px; text-transform: uppercase; }
    .brand-sub { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .address { font-size: 10px; color: #333; }
    
    .meta-grid { display: flex; justify-content: space-between; font-size: 10px; margin: 8px 0; }
    .meta-col { display: flex; flex-direction: column; }
    
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th { font-size: 10px; text-transform: uppercase; padding-bottom: 4px; border-bottom: 1px solid #000; }
    td { padding: 4px 0; vertical-align: top; font-size: 11px; }
    
    .item-name { font-weight: 600; font-size: 12px; padding-bottom: 1px; }
    .item-details { font-size: 10px; color: #333; }
    
    .totals-box { margin-top: 12px; }
    .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
    .totals-row.grand-total { font-size: 16px; font-weight: 800; padding: 6px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 4px; }
    
    .footer { margin-top: 20px; font-size: 10px; font-weight: 600; }
    .barcode-placeholder { margin: 15px auto; width: 80%; height: 30px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 5px, #fff 5px, #fff 8px); }
  </style>
</head>
<body onload="window.print()">
  <div class="text-center header">
    <div class="brand">MEDISQUARE</div>
    <div class="brand-sub">Pharmacy & Clinic</div>
    <div class="address">123 Main Road, Eheliyagoda<br>Tel: +94 45 22 12345</div>
  </div>
  
  <div class="divider-thick"></div>
  
  <div class="meta-grid">
    <div class="meta-col">
      <span style="color:#555">Receipt No</span>
      <span class="text-bold">{{saleNumber}}</span>
    </div>
    <div class="meta-col text-right">
      <span style="color:#555">Date & Time</span>
      <span class="text-bold">{{completedAt}}</span>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th class="text-left">Item</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each lines}}
      <tr>
        <td style="width: 60%">
          <div class="item-name">{{productName}}</div>
          <div class="item-details">{{unitPrice}} × {{quantity}} {{unitName}}</div>
        </td>
        <td class="text-right text-bold" style="width: 15%; vertical-align: middle;">{{quantity}}</td>
        <td class="text-right text-bold" style="width: 25%; vertical-align: middle;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  
  <div class="totals-box">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>{{subtotal}}</span>
    </div>
    <div class="totals-row" style="color: #444">
      <span>Discount</span>
      <span>-{{discountAmount}}</span>
    </div>
    <div class="totals-row grand-total">
      <span>TOTAL</span>
      <span>Rs {{total}}</span>
    </div>
  </div>
  
  <div class="text-center footer">
    <div class="barcode-placeholder"></div>
    Thank you for your visit!<br>
    Wishing you good health.
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
    const receipt = await getSaleReceiptById(id);
    
    if (!receipt) {
      return new NextResponse("Receipt not found", { status: 404 });
    }

    const template = Handlebars.compile(receiptTemplate);
    const html = template({
      ...receipt,
      completedAt: new Date(receipt.completedAt).toLocaleString(),
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Print Error:", error);
    return new NextResponse("Failed to generate receipt", { status: 500 });
  }
}
