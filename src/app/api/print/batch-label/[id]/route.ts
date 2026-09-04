import { NextResponse } from "next/server";
import { getBatchPrintDetails } from "@/modules/inventory/inventory.service";
import Handlebars from "handlebars";

/**
 * Generates clean, 100% visible SVG black barcode bars for thermal printing.
 */
function generateBarcodeSvg(text: string): string {
  const bars: string[] = [];
  bars.push('<rect x="5" y="0" width="2" height="18" fill="#000000"/>');
  bars.push('<rect x="9" y="0" width="1" height="18" fill="#000000"/>');

  let x = 12;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const s1 = ((charCode * 2) % 3) + 1;
    const w2 = ((charCode * 3) % 3) + 1;
    const s2 = ((charCode * 4) % 3) + 1;

    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${w1.toFixed(1)}" height="18" fill="#000000"/>`);
    x += w1 + s1;
    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${w2.toFixed(1)}" height="18" fill="#000000"/>`);
    x += w2 + s2;
  }

  bars.push(`<rect x="${x.toFixed(1)}" y="0" width="3" height="18" fill="#000000"/>`);
  bars.push(`<rect x="${(x + 5).toFixed(1)}" y="0" width="1" height="18" fill="#000000"/>`);
  const totalWidth = Math.max(x + 10, 180);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(1)} 18" style="width:100%; height:14px; display:block;" preserveAspectRatio="none">${bars.join("")}</svg>`;
}

const labelTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GRN Batch Receipt - {{grnNo}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: 50mm 40mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      width: 50mm;
      min-height: 35mm;
      margin: 0;
      padding: 2mm 2.5mm;
      box-sizing: border-box;
      font-size: 8px;
      line-height: 1.25;
      color: #0f172a;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header {
      font-size: 6.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 1.5px;
    }
    .grn-title {
      font-size: 9.5px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meta-box {
      font-size: 7px;
      color: #334155;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 2px 4px;
      margin: 2.5px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      line-height: 1.3;
    }
    .items-header {
      font-size: 7px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      margin-top: 2px;
      margin-bottom: 1.5px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 1px;
    }
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1.5px;
      margin-bottom: 2px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      font-weight: 600;
    }
    .item-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 32mm;
    }
    .item-qty {
      font-weight: 800;
      color: #0f172a;
    }
    .barcode-box {
      text-align: center;
      margin-top: 3px;
      padding-top: 2px;
      border-top: 1px solid #e2e8f0;
    }
    .barcode-text {
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #0f172a;
      margin-top: 1px;
    }
  </style>
</head>
<body onload="window.print()">
  <div>
    <div class="header">Eheliyagoda Pharmacy ERP • GRN Batch</div>
    
    <div class="grn-title">
      <span>{{grnNo}}</span>
      <span style="font-size:7px; font-weight:700; color:#64748b;">{{supplierName}}</span>
    </div>

    <div class="meta-box">
      <div class="meta-row">
        <span><strong>Print Date:</strong> {{printedAt}}</span>
      </div>
      <div class="meta-row">
        <span><strong>Printed By:</strong> {{printedBy}}</span>
      </div>
    </div>

    <div class="items-header">Items Received in Batch:</div>
    <div class="items-list">
      {{#each items}}
      <div class="item-row">
        <span class="item-name">• {{name}}</span>
        <span class="item-qty">Qty: {{qty}} {{unit}}</span>
      </div>
      {{/each}}
    </div>
  </div>

  <div class="barcode-box">
    {{{barcodeSvg}}}
    <div class="barcode-text">{{barcode}}</div>
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
    const details = await getBatchPrintDetails(id);

    if (!details) {
      return new NextResponse("Batch record not found", { status: 404 });
    }

    const barcodeSvg = generateBarcodeSvg(details.barcode);

    const template = Handlebars.compile(labelTemplate);
    const html = template({
      ...details,
      barcodeSvg,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Batch Label Print Error:", error);
    return new NextResponse("Failed to generate batch label", { status: 500 });
  }
}
