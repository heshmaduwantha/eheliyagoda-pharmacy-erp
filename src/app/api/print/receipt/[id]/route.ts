import { NextResponse } from "next/server";
import { formatDateTime } from "@/lib/date-format";
import { getSaleReceiptById } from "@/modules/sales/sale.service";
import { generateCode128Svg } from "@/lib/barcode-svg";
import Handlebars from "handlebars";

const receiptTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - {{saleNumber}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: 80mm auto; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      width: 80mm;
      margin: 0;
      padding: 6mm 5mm;
      font-size: 11px;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 800; }

    .brand-container {
      text-align: center;
      padding-bottom: 6px;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      color: #000000;
      line-height: 1.2;
    }
    .brand-caption {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #555555;
      margin-top: 2px;
    }
    .address-line {
      font-size: 9.5px;
      color: #333333;
      margin-top: 3px;
      line-height: 1.3;
    }

    .divider-dotted {
      border-top: 1px dashed #000000;
      margin: 8px 0;
    }
    .divider-solid {
      border-top: 1.5px solid #000000;
      margin: 8px 0;
    }

    .meta-box {
      background: #f8fafc;
      border-radius: 4px;
      padding: 6px 8px;
      margin: 6px 0 8px;
      border: 1px solid #e2e8f0;
      font-size: 10px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1px 0;
    }
    .meta-label { color: #555555; font-weight: 500; }
    .meta-value { font-weight: 700; color: #000000; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }
    th {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000000;
      padding: 4px 0;
      border-bottom: 1.5px solid #000000;
      font-weight: 800;
    }
    td {
      padding: 5px 0;
      vertical-align: top;
      border-bottom: 1px dashed #e2e8f0;
    }

    .item-name {
      font-weight: 700;
      font-size: 11px;
      color: #000000;
      line-height: 1.25;
    }
    .item-details {
      font-size: 9.5px;
      color: #444444;
      margin-top: 1.5px;
    }

    .totals-box {
      margin-top: 8px;
      padding-top: 4px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 2.5px 0;
      font-size: 10.5px;
      color: #333333;
    }
    .totals-row.discount-row { color: #000000; font-weight: 600; }
    .grand-total-card {
      border: 1.5px solid #000000;
      background: #ffffff;
      color: #000000;
      border-radius: 4px;
      padding: 7px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
    }
    .grand-total-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #000000; }
    .grand-total-value { font-size: 16px; font-weight: 800; color: #000000; }

    .footer {
      margin-top: 14px;
      text-align: center;
      font-size: 9.5px;
      color: #444444;
    }
    .footer-thankyou {
      font-weight: 700;
      color: #000000;
      font-size: 10.5px;
      margin-bottom: 2px;
    }
    .barcode-container {
      margin: 10px auto 6px;
      text-align: center;
    }
    .barcode-text {
      font-family: monospace;
      font-size: 9.5px;
      font-weight: 700;
      color: #000000;
      letter-spacing: 2px;
      margin-top: 4px;
    }
  </style>
</head>
<body onload="window.print()">
  <div class="brand-container">
    <div class="brand-title">Eheliyagoda Pharmacy<br>&amp; Grocery</div>
    <div class="brand-caption">Medisquare</div>
    <div class="address-line">Main Street, Eheliyagoda<br>Tel: 036-2258900 / 077-1234567</div>
  </div>

  <div class="meta-box">
    <div class="meta-row">
      <span class="meta-label">Receipt No:</span>
      <span class="meta-value">{{saleNumber}}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Date &amp; Time:</span>
      <span class="meta-value">{{completedAt}}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Cashier:</span>
      <span class="meta-value">{{#if cashierName}}{{cashierName}}{{else}}Pavithra{{/if}}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-left">Item Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Total (Rs)</th>
      </tr>
    </thead>
    <tbody>
      {{#each lines}}
      <tr>
        <td style="width: 58%">
          <div class="item-name">{{productName}}</div>
          <div class="item-details">Rs {{unitPrice}} / {{unitName}}</div>
        </td>
        <td class="text-right font-bold" style="width: 17%; vertical-align: middle;">{{quantity}}</td>
        <td class="text-right font-bold" style="width: 25%; vertical-align: middle;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>Rs {{subtotal}}</span>
    </div>
    {{#if discountAmount}}
    <div class="totals-row discount-row">
      <span>Discount</span>
      <span>- Rs {{discountAmount}}</span>
    </div>
    {{/if}}
    {{#if taxAmount}}
    <div class="totals-row">
      <span>Tax</span>
      <span>Rs {{taxAmount}}</span>
    </div>
    {{/if}}

    <div class="grand-total-card">
      <span class="grand-total-label">Net Total</span>
      <span class="grand-total-value">Rs {{total}}</span>
    </div>
  </div>

  <div class="barcode-container">
    {{{barcodeSvg}}}
    <div class="barcode-text">{{saleNumber}}</div>
  </div>

  <div class="footer">
    <div class="footer-thankyou">Thank you for your visit!</div>
    Wish you good health &amp; great day ahead.
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

    const dateObj = new Date(receipt.completedAt);
    const formattedDate = isNaN(dateObj.getTime()) ? receipt.completedAt : formatDateTime(dateObj);
    const barcodeSvg = generateCode128Svg(receipt.saleNumber, 36, 1.5);

    const data = {
      ...receipt,
      completedAt: formattedDate,
      barcodeSvg,
    };

    const jsreportUrl = process.env.JSREPORT_URL;
    
    // If JSReport URL is configured, attempt to use it to generate the receipt with a strict timeout
    if (jsreportUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        const jsUser = process.env.JSREPORT_USERNAME;
        const jsPass = process.env.JSREPORT_PASSWORD;
        if (jsUser && jsPass) {
          headers['Authorization'] = `Basic ${Buffer.from(`${jsUser}:${jsPass}`).toString('base64')}`;
        }

        const response = await fetch(`${jsreportUrl}/api/report`, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            template: {
              content: receiptTemplate,
              engine: 'handlebars',
              recipe: 'html', // Use html instead of chrome-pdf so the browser can print it directly
            },
            data
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn("JSReport returned non-ok status:", await response.text());
        } else {
          const htmlContent = await response.text();
          return new NextResponse(htmlContent, {
            headers: {
              "Content-Type": "text/html",
            },
          });
        }
      } catch {
        // JSReport service unavailable — fallback silently to local HTML render
      }
    }

    // Fallback to local HTML rendering if JSReport is not configured or failed
    const template = Handlebars.compile(receiptTemplate);
    const html = template(data);

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
