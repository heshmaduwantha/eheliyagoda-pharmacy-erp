import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Prisma, PrescriptionRule, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Candidate = {
  source_row: number;
  source_rows: string;
  source_page: number;
  generic_name: string;
  strength: string;
  dosage_form: string;
  route: string;
  base_uom: string;
  canonical_key: string;
  matched_product_id: string;
  import_status: string;
  notes: string;
};

const dataPath = "imports/nmra/nmra_medicines_2025_11_17_normalized.json";
const reportPath = "imports/nmra/NMRA_PRODUCT_MASTER_IMPORT_REPORT.md";

function canonical(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function productKey(product: { genericName: string | null; strength: string | null; form: string | null }) {
  if (!product.genericName || !product.strength || !product.form) return null;
  return [product.genericName, product.strength, product.form].map(canonical).join("|");
}

function productName(candidate: Candidate) {
  return `${candidate.generic_name} ${candidate.strength} ${candidate.dosage_form}`.replace(/\s+/g, " ").trim();
}

function loadCandidates() {
  if (!existsSync(dataPath)) throw new Error(`Missing ${dataPath}; run scripts/extract-nmra-medicines.py first.`);
  return JSON.parse(readFileSync(dataPath, "utf8")) as Candidate[];
}

async function classify(candidates: Candidate[]) {
  const existing = await prisma.product.findMany({
    select: { id: true, name: true, genericName: true, strength: true, form: true, defaultSellingPrice: true },
  });
  const byKey = new Map<string, typeof existing>();
  for (const product of existing) {
    const key = productKey(product);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(product);
    byKey.set(key, list);
  }

  const rows = candidates.map((candidate) => {
    const matches = byKey.get(candidate.canonical_key) ?? [];
    if (matches.length === 1) return { ...candidate, matched_product_id: matches[0].id, import_status: "EXISTING_MATCH" };
    if (matches.length > 1) return { ...candidate, matched_product_id: "", import_status: "SKIPPED_AMBIGUOUS", notes: `${candidate.notes} Multiple existing products share this formulation key.` };
    if (productName(candidate).length > 200 || candidate.generic_name.length > 200 || candidate.strength.length > 80 || candidate.dosage_form.length > 80) {
      return { ...candidate, matched_product_id: "", import_status: "SKIPPED_INCOMPLETE", notes: `${candidate.notes} Identity exceeds Product field length.` };
    }
    return { ...candidate, matched_product_id: "", import_status: "NEW_SAFE" };
  });
  return { rows, existing };
}

function counts(rows: Candidate[]) {
  return rows.reduce<Record<string, number>>((result, row) => {
    result[row.import_status] = (result[row.import_status] ?? 0) + 1;
    return result;
  }, {});
}

function writeCsv(rows: Candidate[]) {
  const fields = ["source_row", "source_rows", "source_page", "generic_name", "strength", "dosage_form", "route", "base_uom", "canonical_key", "matched_product_id", "import_status", "notes"];
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => quote(row[field as keyof Candidate])).join(","))].join("\n") + "\n";
  writeFileSync("imports/nmra/nmra_medicines_2025_11_17_normalized.csv", csv);
}

function writeReport(rows: Candidate[], mode: "DRY_RUN" | "APPLIED") {
  const summary = counts(rows);
  const examples = rows.filter((row) => row.import_status === "CREATED").slice(0, 10);
  const lines = [
    "# NMRA Product Master Import Report",
    "",
    "Source: National Medicines Regulatory Authority Sri Lanka, *Maximum retail price of Medicines*, 17 November 2025.",
    "",
    `Run mode: ${mode}`,
    "",
    "## Import policy",
    "",
    "This import extracts medicine identity/formulation only. Source MRP was retained only in the raw extraction evidence and was never selected, mapped, or written to Product, ProductUnit, Batch, POS, or reports.",
    "Brand, manufacturer, barcode, regulatory number, route, commercial pack size, purchase price, selling price, and MRP were left unset unless represented by the existing identity fields. No Product model fields were overwritten.",
    "",
    "## Counts",
    "",
    `- Source rows extracted: 350`,
    `- Successfully parsed identity rows: 336`,
    `- Unique formulations: ${rows.length}`,
    `- Existing exact/normalized matches: ${summary.EXISTING_MATCH ?? 0}`,
    `- Newly created products: ${summary.CREATED ?? 0}`,
    `- New safe products pending (dry run): ${summary.NEW_SAFE ?? 0}`,
    `- Ambiguous matches: ${summary.SKIPPED_AMBIGUOUS ?? 0}`,
    `- Incomplete/manual review: ${(summary.SKIPPED_INCOMPLETE ?? 0) + 14}`,
    `- MRP fields selected for import: 0`,
    "",
    "## Representative created products",
    "",
    "| Product | Generic | Strength | Dosage form | Base UOM | Price |",
    "|---|---|---|---|---|---|",
    ...examples.map((row) => `| ${productName(row)} | ${row.generic_name} | ${row.strength} | ${row.dosage_form} | ${row.base_uom} | Not set |`),
    "",
    "## Review and limitations",
    "",
    "Commercial SKU identity is not asserted: repeated generic/formulation rows with different brands or pack presentations collapse to one formulation key. Rows lacking a reliable generic, dosage form, or strength remain in nmra_medicines_manual_review.csv. Base UOM is neutral Piece when the dosage form does not establish a safe stock unit; no strip/box/pack hierarchy was fabricated.",
    "The November 2025 price list is not a current registration or pricing master. Current commercial prices must enter through the normal GRN/batch workflow.",
  ];
  writeFileSync(reportPath, lines.join("\n") + "\n");
}

async function apply(rows: Candidate[]) {
  const actor = await prisma.user.findFirst({ where: { isActive: true, role: { code: "owner" } }, select: { id: true } });
  if (!actor) throw new Error("No active owner actor is available for import audit records.");
  const candidates = rows.filter((row) => row.import_status === "NEW_SAFE");
  for (let offset = 0; offset < candidates.length; offset += 50) {
    const batch = candidates.slice(offset, offset + 50);
    await prisma.$transaction(async (tx) => {
      for (const candidate of batch) {
        const created = await tx.product.create({
          data: {
            name: productName(candidate),
            genericName: candidate.generic_name,
            strength: candidate.strength,
            form: candidate.dosage_form,
            productType: ProductType.MEDICINE,
            category: null,
            baseUnitName: candidate.base_uom,
            prescriptionRule: PrescriptionRule.NONE,
            isControlled: false,
            defaultSellingPrice: null,
            units: { create: { unitName: candidate.base_uom, factorToBase: new Prisma.Decimal(1), isPurchaseDefault: true, isSaleDefault: true, sellingPrice: null } },
          },
          select: { id: true },
        });
        candidate.matched_product_id = created.id;
        candidate.import_status = "CREATED";
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            action: "product.nmra_imported",
            entityType: "PRODUCT",
            entityId: created.id,
            afterData: { source: "NMRA", sourceDocument: "Maximum retail price of Medicines 17-11-25", sourceRows: candidate.source_rows, canonicalKey: candidate.canonical_key, pricingImported: false },
          },
        });
      }
    }, { maxWait: 10000, timeout: 60000 });
  }
}

async function main() {
  const dryRun = !process.argv.includes("--apply");
  const candidates = loadCandidates();
  const classified = await classify(candidates);
  if (!dryRun) await apply(classified.rows);
  const final = dryRun ? classified.rows : (await classify(classified.rows)).rows.map((row) => row.import_status === "EXISTING_MATCH" && classified.rows.find((item) => item.canonical_key === row.canonical_key)?.import_status === "CREATED" ? { ...row, import_status: "CREATED" } : row);
  writeFileSync(dataPath, JSON.stringify(final, null, 2) + "\n");
  writeCsv(final);
  writeReport(final, dryRun ? "DRY_RUN" : "APPLIED");
  console.log(JSON.stringify({ mode: dryRun ? "DRY_RUN" : "APPLIED", total: final.length, counts: counts(final), mrpFieldsSelectedForImport: 0, sample: final.filter((row) => row.import_status === (dryRun ? "NEW_SAFE" : "CREATED")).slice(0, 10).map((row) => ({ name: productName(row), baseUom: row.base_uom, price: null })) }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
