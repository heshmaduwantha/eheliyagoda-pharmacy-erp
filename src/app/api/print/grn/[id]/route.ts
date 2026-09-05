import { NextResponse } from "next/server";
import { formatDateOnly } from "@/lib/date-format";
import { getGrn } from "@/modules/procurement/grn.service";
import Handlebars from "handlebars";

const grnPrintTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Goods Received Note - {{grnNo}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { margin: 12mm; size: A4 portrait; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #000000;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
    }
    
    .grn-container {
      max-width: 820px;
      margin: 0 auto;
    }
    
    /* Header */
    .title {
      text-align: center;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    
    .header-double-line {
      border-top: 3px solid #000000;
      border-bottom: 1px solid #000000;
      height: 4px;
      margin-top: 8px;
      margin-bottom: 24px;
    }
    
    /* Top Metadata */
    .meta-top {
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 24px;
      line-height: 1.8;
    }

    .meta-top span {
      font-weight: 500;
    }
    
    /* Grid info */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 24px;
    }
    
    .section-header {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 8px;
      color: #000000;
    }
    
    .info-row {
      margin-bottom: 4px;
      font-size: 11px;
      font-weight: 700;
      color: #000000;
    }

    .info-row span {
      font-weight: 400;
    }

    /* Items Table */
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      margin-bottom: 24px;
    }

    .table-banner {
      background-color: #0047AB;
      color: #ffffff;
      font-size: 12px;
      font-weight: 800;
      text-align: center;
      padding: 7px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #000000;
    }

    table.items-table th.sub-th {
      background-color: #D9D9D9;
      color: #000000;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 8px 6px;
      border: 1px solid #000000;
      text-align: center;
      vertical-align: middle;
    }

    table.items-table td {
      padding: 8px 8px;
      border: 1px solid #000000;
      font-size: 11px;
      color: #000000;
      height: 32px;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }

    /* Summary table at bottom right */
    .summary-box {
      width: 360px;
      margin-left: auto;
      border-collapse: collapse;
      margin-bottom: 32px;
    }

    .summary-box td {
      border: 1px solid #000000;
      padding: 7px 12px;
      font-size: 11px;
    }

    .summary-label {
      background: #D9D9D9;
      font-weight: 800;
      text-transform: uppercase;
      width: 50%;
    }

    .summary-val {
      font-weight: 700;
    }

    /* Condition & Comments */
    .field-block {
      margin-top: 24px;
    }

    .underline-line {
      border-bottom: 1.5px solid #000000;
      height: 28px;
      margin-top: 4px;
    }
  </style>
</head>
<body onload="window.print()">
  <div class="grn-container">
    <div class="title">GOODS RECEIVED NOTE</div>
    <div class="header-double-line"></div>

    <div class="meta-top">
      <div>GRN NUMBER: <span>{{grnNo}}</span></div>
      <div>DATE: <span>{{formattedDate}}</span></div>
    </div>

    <div class="info-grid">
      <div>
        <div class="section-header">DELIVERY INFORMATION:</div>
        <div class="info-row">DELIVERY NOTE NUMBER: <span>{{supplierInvoiceNo}}</span></div>
        <div class="info-row">DELIVERY DATE: <span>{{formattedDate}}</span></div>
        <div class="info-row">CARRIER/DRIVER NAME: <span>Standard Delivery</span></div>
      </div>

      <div>
        <div class="section-header">SUPPLIER INFORMATION:</div>
        <div class="info-row">SUPPLIER NAME: <span>{{supplierName}}</span></div>
        <div class="info-row">SUPPLIER ADDRESS: <span>{{supplierAddress}}</span></div>
        <div class="info-row">SUPPLIER CONTACT INFORMATION: <span>{{supplierPhone}}</span></div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <div class="section-header">RECEIVED BY:</div>
      <div class="info-row">Name: <span>{{receivedByName}}</span></div>
      <div class="info-row">Receiving Department: <span>Pharmacy Procurement</span></div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th colspan="7" class="table-banner">RECEIVED ITEMS</th>
        </tr>
        <tr>
          <th class="sub-th" style="width: 10%;">ITEM</th>
          <th class="sub-th" style="width: 30%;">DESCRIPTION</th>
          <th class="sub-th" style="width: 14%;">UNIT OF MEASURE</th>
          <th class="sub-th" style="width: 12%;">QUANTITY ORDERED</th>
          <th class="sub-th" style="width: 12%;">QUANTITY RECEIVED</th>
          <th class="sub-th" style="width: 11%;">UNIT PRICE</th>
          <th class="sub-th" style="width: 11%;">TOTAL PRICE</th>
        </tr>
      </thead>
      <tbody>
        {{#each lines}}
        <tr>
          <td class="text-center">{{itemNo}}</td>
          <td>
            <strong>{{productName}}</strong>
            {{#if genericName}}<div style="font-size: 10px; color: #555;">{{genericName}}</div>{{/if}}
          </td>
          <td class="text-center">{{unitName}}</td>
          <td class="text-center">{{#if isFilled}}{{qtyInUnit}}{{/if}}</td>
          <td class="text-center font-bold">{{#if isFilled}}{{qtyInUnit}}{{/if}}</td>
          <td class="text-right">{{#if isFilled}}LKR {{costPrice}}{{/if}}</td>
          <td class="text-right font-bold">{{#if isFilled}}LKR {{lineTotal}}{{/if}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <table class="summary-box">
      <tr>
        <td class="summary-label">TOTAL ITEMS</td>
        <td class="summary-val text-center">{{totalItems}}</td>
      </tr>
      <tr>
        <td class="summary-label">TOTAL AMOUNT</td>
        <td class="summary-val text-right">LKR {{totalAmount}}</td>
      </tr>
    </table>

    <div class="field-block">
      <div class="section-header">RECEIVED CONDITION:</div>
      <div class="underline-line"></div>
    </div>

    <div class="field-block" style="margin-top: 28px;">
      <div class="section-header">COMMENTS:</div>
      <div class="underline-line"></div>
      <div class="underline-line"></div>
      <div class="underline-line"></div>
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
    const grn = await getGrn(id);

    if (!grn) {
      return new NextResponse("Goods Received Note not found", { status: 404 });
    }

    const dateObj = grn.receivedAt ?? grn.createdAt;
    const formattedDate = formatDateOnly(dateObj);

    const rawLines = grn.lines.map((line, index) => ({
      itemNo: `Item ${index + 1}`,
      productName: line.product.name,
      genericName: line.product.genericName,
      unitName: line.unit.unitName,
      qtyInUnit: String(Number(line.qtyInUnit)),
      costPrice: Number(line.costPrice).toFixed(2),
      lineTotal: (Number(line.qtyInUnit) * Number(line.costPrice)).toFixed(2),
      isFilled: true,
    }));

    const minRows = 5;
    const lines = [...rawLines];
    while (lines.length < minRows) {
      lines.push({
        itemNo: "",
        productName: "",
        genericName: "",
        unitName: "",
        qtyInUnit: "",
        costPrice: "",
        lineTotal: "",
        isFilled: false,
      });
    }

    const template = Handlebars.compile(grnPrintTemplate);
    const html = template({
      grnNo: grn.grnNo,
      supplierInvoiceNo: grn.supplierInvoiceNo ?? "—",
      formattedDate,
      supplierName: grn.supplier.name,
      supplierAddress: grn.supplier.address ?? "Eheliyagoda, Sri Lanka",
      supplierPhone: grn.supplier.phone ?? "—",
      receivedByName: grn.receivedBy?.name ?? "System Administrator",
      lines,
      totalItems: grn.lines.length,
      totalAmount: Number(grn.invoiceTotal).toFixed(2),
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("[GRN Print Error]:", error);
    return new NextResponse("Failed to render Goods Received Note", { status: 500 });
  }
}
