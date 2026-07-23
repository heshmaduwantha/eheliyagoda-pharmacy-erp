import {
  GrnStatus,
  PaymentMethod,
  PrescriptionRule,
  Prisma,
  PrismaClient,
  ProductType,
  SaleStatus,
  StockMovementType,
  SupplierInvoiceStatus,
  ExpenseCategory,
} from "@prisma/client";

const prisma = new PrismaClient();
const runId = Math.random().toString(36).substring(7);

async function main() {
  console.log(`Starting dummy data generation with runId: ${runId}...`);

  const ownerRole = await prisma.role.findUnique({ where: { code: "owner" } });
  const ownerUser = await prisma.user.findFirst({ where: { roleId: ownerRole?.id } });
  if (!ownerUser) {
    throw new Error("Owner user not found. Run main seed first.");
  }

  // 1. Generate 20 Suppliers
  const suppliers = [];
  for (let i = 1; i <= 20; i++) {
    suppliers.push(
      await prisma.supplier.create({
        data: {
          name: `Dummy Supplier ${i} - ${runId}`,
          contactPerson: `Contact ${i}`,
          phone: `0700${runId.slice(0,2)}${i.toString().padStart(2, "0")}`,
          email: `supplier${i}_${runId}@example.com`,
          address: `Address ${i}, City`,
          creditTermDays: 30,
        },
      })
    );
  }
  console.log(`Created 20 suppliers.`);

  // 2. Generate 60 Products (20 out of stock, 20 low stock, 20 normal)
  const products = [];
  for (let i = 1; i <= 60; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Dummy Product ${i} - ${runId}`,
        genericName: `Generic ${i}`,
        productType: ProductType.MEDICINE,
        category: "General",
        baseUnitName: "tablet",
        prescriptionRule: PrescriptionRule.NONE,
        reorderLevel: new Prisma.Decimal(50),
        isActive: true,
      },
    });

    const unit = await prisma.productUnit.create({
      data: {
        productId: product.id,
        unitName: "tablet",
        factorToBase: new Prisma.Decimal(1),
        isSaleDefault: true,
        isPurchaseDefault: true,
      },
    });

    products.push({ product, unit });
  }
  console.log(`Created 60 products.`);

  // 3. Generate GRNs & Batches
  const now = new Date();
  
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - 30); // expired

  const soonDate = new Date(now);
  soonDate.setDate(soonDate.getDate() + 45); // expiring soon

  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 365); // expiring normal

  for (let i = 0; i < 60; i++) {
    const p = products[i];
    const supplier = suppliers[i % suppliers.length];
    
    let qty = 0;
    if (i >= 20 && i < 40) qty = 20; // low stock
    if (i >= 40) qty = 100; // normal stock

    let expiry = futureDate;
    if (i % 3 === 0) expiry = pastDate;
    else if (i % 3 === 1) expiry = soonDate;

    if (qty > 0) {
      const grn = await prisma.grn.create({
        data: {
          grnNo: `GRN-${runId}-${i + 1}`,
          supplierId: supplier.id,
          supplierInvoiceNo: `INV-${runId}-${i + 1}`,
          invoiceTotal: new Prisma.Decimal(qty * 5),
          status: GrnStatus.CONFIRMED,
          receivedById: ownerUser.id,
          receivedAt: new Date(),
        },
      });

      const grnLine = await prisma.grnLine.create({
        data: {
          grnId: grn.id,
          productId: p.product.id,
          unitId: p.unit.id,
          qtyInUnit: new Prisma.Decimal(qty),
          qtyBase: new Prisma.Decimal(qty),
          batchNo: `B-${runId}-${i + 1}`,
          expiryDate: expiry,
          costPrice: new Prisma.Decimal(5),
          sellingPrice: new Prisma.Decimal(10 + i),
        },
      });

      const batch = await prisma.batch.create({
        data: {
          productId: p.product.id,
          grnLineId: grnLine.id,
          batchNo: `B-${runId}-${i + 1}`,
          expiryDate: expiry,
          costPrice: new Prisma.Decimal(5),
          sellingPrice: new Prisma.Decimal(10 + i),
          priceUnitId: p.unit.id,
          priceSetById: ownerUser.id,
          priceSetAt: new Date(),
          qtyOnHandBase: new Prisma.Decimal(qty),
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: p.product.id,
          batchId: batch.id,
          movementType: StockMovementType.GRN_IN,
          qtyBase: new Prisma.Decimal(qty),
          refType: "GRN",
          refId: grn.id,
          createdById: ownerUser.id,
        },
      });
      
      const invoiceStatus = SupplierInvoiceStatus.OPEN;
      const dueDate = new Date();
      if (i % 2 === 0) {
        dueDate.setDate(dueDate.getDate() - 10);
      } else {
        dueDate.setDate(dueDate.getDate() + 10);
      }

      await prisma.supplierInvoice.create({
        data: {
          supplierId: supplier.id,
          grnId: grn.id,
          invoiceNo: `INV-${runId}-${i + 1}`,
          totalAmount: new Prisma.Decimal(qty * 5),
          status: invoiceStatus,
          dueDate: dueDate,
        },
      });
    }
  }
  console.log(`Created GRNs, Batches, Invoices.`);

  // 4. Generate 20 Sales for today
  for (let i = 1; i <= 20; i++) {
    const p = products[40 + (i % 20)];
    const batch = await prisma.batch.findFirst({ where: { productId: p.product.id, status: "ACTIVE" } });
    if (!batch) continue;

    const qty = 2;
    
    const sale = await prisma.sale.create({
      data: {
        saleNumber: `S-${runId}-${1000 + i}`,
        status: SaleStatus.COMPLETED,
        subtotal: new Prisma.Decimal(qty * Number(batch.sellingPrice)),
        discountAmount: new Prisma.Decimal(0),
        taxAmount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(qty * Number(batch.sellingPrice)),
        cashierId: ownerUser.id,
      },
    });

    await prisma.saleLine.create({
      data: {
        saleId: sale.id,
        productId: p.product.id,
        batchId: batch.id,
        unitId: p.unit.id,
        qty: new Prisma.Decimal(qty),
        qtyBase: new Prisma.Decimal(qty),
        unitPrice: batch.sellingPrice,
        lineTotal: new Prisma.Decimal(qty * Number(batch.sellingPrice)),
        discountAmount: new Prisma.Decimal(0),
        costPriceAtSale: batch.costPrice,
        productNameSnapshot: p.product.name,
      },
    });

    await prisma.salePayment.create({
      data: {
        saleId: sale.id,
        method: i % 2 === 0 ? PaymentMethod.CASH : PaymentMethod.CARD,
        amount: new Prisma.Decimal(qty * Number(batch.sellingPrice)),
      }
    });

    await prisma.batch.update({
      where: { id: batch.id },
      data: { qtyOnHandBase: { decrement: qty } },
    });

    await prisma.stockMovement.create({
      data: {
        productId: p.product.id,
        batchId: batch.id,
        movementType: StockMovementType.SALE_OUT,
        qtyBase: new Prisma.Decimal(qty),
        refType: "SALE",
        refId: sale.id,
        createdById: ownerUser.id,
      },
    });
  }
  console.log(`Created 20 Sales.`);

  // 5. Generate 20 Expenses
  for (let i = 1; i <= 20; i++) {
    await prisma.expense.create({
      data: {
        expenseNumber: `E-${runId}-${1000 + i}`,
        amount: new Prisma.Decimal(100 + i * 5),
        category: i % 2 === 0 ? ExpenseCategory.ELECTRICITY : ExpenseCategory.MAINTENANCE,
        description: `Dummy Expense ${i}`,
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        createdById: ownerUser.id,
      },
    });
  }
  console.log(`Created 20 Expenses.`);

  console.log("Dummy data generation complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
