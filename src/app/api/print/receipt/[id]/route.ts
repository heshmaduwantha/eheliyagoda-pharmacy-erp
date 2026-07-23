import { NextResponse } from "next/server";
import { getSaleReceiptById } from "@/modules/sales/sale.service";
import { getJsReport } from "@/lib/jsreport";

// Example handlebars template for 80mm thermal receipt
const receiptTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - {{saleNumber}}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 80mm;
      margin: 0;
      padding: 5mm;
      box-sizing: border-box;
      font-size: 12px;
      line-height: 1.2;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .subtitle { font-size: 12px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 0; vertical-align: top; }
    .totals { margin-top: 10px; }
    .totals td { padding: 1px 0; }
    .footer { margin-top: 15px; font-size: 10px; }
  </style>
</head>
<body onload="window.print()">
  <div class="text-center">
    <div class="title">MEDISQUARE</div>
    <div class="subtitle">Pharmacy & Clinic</div>
    <div>Eheliyagoda</div>
  </div>
  
  <div class="divider"></div>
  
  <div>
    Sale No: {{saleNumber}}<br>
    Date: {{completedAt}}<br>
  </div>
  
  <div class="divider"></div>
  
  <table>
    <thead>
      <tr>
        <th class="text-left">Item</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each lines}}
      <tr>
        <td colspan="4" class="text-bold">{{productName}}</td>
      </tr>
      <tr>
        <td>{{unitName}}</td>
        <td class="text-right">{{quantity}}</td>
        <td class="text-right">{{unitPrice}}</td>
        <td class="text-right">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  
  <div class="divider"></div>
  
  <table class="totals">
    <tr>
      <td>Subtotal:</td>
      <td class="text-right">{{subtotal}}</td>
    </tr>
    <tr>
      <td>Discount:</td>
      <td class="text-right">-{{discountAmount}}</td>
    </tr>
    <tr>
      <td class="text-bold">Total:</td>
      <td class="text-right text-bold">{{total}}</td>
    </tr>
  </table>
  
  <div class="divider"></div>
  
  <div class="text-center footer">
    Thank you for your visit!<br>
    Come again.
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

    const jsreport = await getJsReport();
    
    // Render as HTML instead of PDF so the browser can natively print it
    // on a thermal roll without chrome-pdf margins breaking it.
    const report = await jsreport.render({
      template: {
        content: receiptTemplate,
        engine: "handlebars",
        recipe: "html",
      },
      data: {
        ...receipt,
        completedAt: new Date(receipt.completedAt).toLocaleString(),
      },
    });

    return new NextResponse(report.content, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Print Error:", error);
    return new NextResponse("Failed to generate receipt", { status: 500 });
  }
}
