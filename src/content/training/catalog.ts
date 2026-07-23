import type { TrainingCategory, TrainingLesson, TrainingStep } from "./types";

export const trainingCategories: TrainingCategory[] = [
  { key: "setup", titleSi: "පද්ධති සැකසුම", titleEn: "System setup", descriptionSi: "Login, Settings, Users සහ Roles සකස් කරගන්න." },
  { key: "products", titleSi: "Product සහ ඖෂධ සැකසුම", titleEn: "Product and medicine setup", descriptionSi: "Base unit, conversion සහ prescription rules තේරුම් ගන්න." },
  { key: "suppliers", titleSi: "Supplier සැකසුම", titleEn: "Supplier setup", descriptionSi: "Supplier master data සහ credit terms පවත්වාගන්න." },
  { key: "purchasing", titleSi: "මිලදී ගැනීම", titleEn: "Purchasing", descriptionSi: "දැනට තිබෙන direct GRN මිලදී ගැනීමේ මාර්ගය හඳුනාගන්න." },
  { key: "grn", titleSi: "භාණ්ඩ භාරගැනීම", titleEn: "Goods receiving", descriptionSi: "DRAFT GRN එක නිවැරදිව confirm කරන්න." },
  { key: "inventory", titleSi: "Inventory සහ Batch", titleEn: "Inventory and batches", descriptionSi: "Base-unit stock, batch සහ movement ledger කියවන්න." },
  { key: "pos", titleSi: "POS විකුණුම්", titleEn: "POS sales", descriptionSi: "Search, unit conversion, payment සහ receipt workflow." },
  { key: "prescriptions", titleSi: "Prescription සහ Controlled medicine", titleEn: "Prescriptions and controlled medicines", descriptionSi: "Patient/prescriber තොරතුරු සහ compliance rules." },
  { key: "corrections", titleSi: "Returns සහ නිවැරදි කිරීම්", titleEn: "Returns and corrections", descriptionSi: "Completed sale delete නොකර void කරන ආකාරය." },
  { key: "expiry", titleSi: "Expiry සහ Write-off", titleEn: "Expiry and write-off", descriptionSi: "Near-expiry alerts සහ දැනට නොමැති action boundaries." },
  { key: "payments", titleSi: "Supplier ගෙවීම්", titleEn: "Supplier payments", descriptionSi: "Partial payments සහ outstanding balance." },
  { key: "expenses", titleSi: "වියදම්", titleEn: "Expenses", descriptionSi: "Operational expenses supplier payments වලින් වෙන් කර තබන්න." },
  { key: "reports", titleSi: "Reports සහ දෛනික මෙහෙයුම්", titleEn: "Reports and daily operations", descriptionSi: "Sales, profit, stock, expense සහ payable reports." },
  { key: "security", titleSi: "Users, Roles සහ ආරක්ෂාව", titleEn: "Users, roles, and security", descriptionSi: "නිවැරදි access සහ actor accountability." },
  { key: "troubleshooting", titleSi: "ගැටලු විසඳීම", titleEn: "Troubleshooting", descriptionSi: "සැබෑ validation messages අනුව විසඳුම් සොයන්න." },
];

const unavailableStep = (name: string): TrainingStep => ({
  title: `${name} දැනට භාවිතයට නොමැත`,
  page: "Training guide",
  action: "මෙම action සඳහා operational page හෝ button එකක් current application එකේ නැති බව සටහන් කරගන්න.",
  result: "අලුත් feature එකක් තිබෙන බව වැරදි ලෙස නොසිතයි; administrator වෙත escalation කළ හැක.",
});

export const scenarioLessons: TrainingLesson[] = [
  {
    key: "scenario.product-to-sale", slug: "product-to-sale", kind: "scenario", category: "grn",
    titleSi: "අලුත් ඖෂධයක් Supplier සිට Customer දක්වා", titleEn: "Medicine from supplier to customer sale",
    summarySi: "Paracetamol 500mg Product එක direct GRN මගින් batch stock කර POS එකෙන් විකිණීම.", difficulty: "intermediate", estimatedMinutes: 28,
    businessContext: "එකම Product record එක supplier delivery, batch stock, payable, POS sale සහ reports අතර සම්බන්ධ වන ආකාරය මෙම පාඩමෙන් පෙන්වයි.",
    prerequisites: ["ABC Pharmaceuticals Supplier එක තිබීම හෝ create කිරීමට permission තිබීම", "Product සහ GRN manage permissions", "POS sale create permission"],
    requiredPermissions: ["suppliers.manage", "inventory.product.manage", "procurement.grn.manage", "pos.sale.create"], relatedRoute: "/stock/grn", relatedRouteLabel: "Goods Received විවෘත කරන්න",
    steps: [
      { title: "Supplier එක තහවුරු කරන්න", page: "Suppliers", action: "Supplier list එකේ ABC Pharmaceuticals සොයන්න. නැත්නම් New supplier form එක පුරවන්න.", fields: ["Name", "Contact person", "Phone", "Credit term days"], example: "ABC Pharmaceuticals · 30 days", result: "Active Supplier record එකක් ලැබේ; stock වෙනස් නොවේ." },
      { title: "Product එක සකස් කරන්න", page: "Products", action: "New product form එකෙන් medicine එක create කරන්න.", fields: ["Name", "Generic name", "Strength", "Form", "Product type", "Base unit", "Prescription rule"], example: "Paracetamol 500mg · MEDICINE · Tablet · NONE", result: "Product සහ ProductUnit records සාදයි; stock තවම 0." },
      { title: "Unit conversion දාන්න", page: "Products", action: "Tablet, Strip සහ Box units එකතු කර factor to base නිවැරදිව දාන්න.", fields: ["Tablet = 1", "Strip = 10", "Box = 100"], example: "1 Box × 10 strips × 10 tablets = 100 Tablets", result: "සියලු stock quantity Tablet base units වලින් ගණනය කළ හැක." },
      { title: "Direct GRN draft එකක් සාදන්න", page: "Goods Received → New GRN", action: "Supplier තෝරා Product line එක ඇතුළත් කර Save draft කරන්න.", fields: ["Supplier", "Product", "Unit", "Quantity", "Batch", "Expiry", "MRP", "Cost price", "Selling price"], example: "10 Box · PCM-2026-01 · MRP Rs. 5.00 per tablet", result: "DRAFT GRN එකක් සාදයි. Stock හෝ payable වෙනස් නොවේ." },
      { title: "GRN detail නැවත පරීක්ෂා කරන්න", page: "Goods Received → GRN detail", action: "Qty, Base qty, Batch, Expiry, MRP, Cost සහ Price columns පරීක්ෂා කරන්න.", example: "10 Box = 1,000 Tablet", result: "වැරදි batch/price එක confirm කිරීමට පෙර හඳුනාගනී." },
      { title: "Confirm GRN කරන්න", page: "GRN detail", action: "Confirm GRN button එක click කරන්න.", result: "GRN CONFIRMED වෙයි; Batch එක ACTIVE වෙයි; GRN_IN movement එකක් සහ SupplierInvoice payable එකක් සාදයි." },
      { title: "Batch stock බලන්න", page: "Stock → Batch register", action: "Paracetamol හෝ PCM-2026-01 සොයන්න.", result: "Batch pricing, expiry සහ 1,000 base-unit quantity පෙන්වයි." },
      { title: "POS cart එකට එකතු කරන්න", page: "Point of Sale", action: "Product search හෝ barcode මගින් item එක add කර Box, Strip හෝ Tablet unit එක තෝරන්න.", example: "1 Box හෝ 2 Strip හෝ 15 Tablet", result: "Cart price ගණනය වේ; stock තවම අඩු නොවේ." },
      { title: "Payment සහ prescription decision සම්පූර්ණ කරන්න", page: "Point of Sale", action: "Cash/Card/Split payment total එක match කර Continue කරන්න. Prompt තිබේ නම් record හෝ reason සමඟ skip කරන්න.", result: "Server validation FEFO batches, stock, expiry සහ MRP ceiling පරීක්ෂා කරයි." },
      { title: "Sale complete කරන්න", page: "Point of Sale", action: "Final confirmation එකෙන් පසු receipt බලන්න.", result: "Sale COMPLETED වෙයි; SALE_OUT movements ලියයි; batch stock අඩු කර receipt සහ reports update කරයි." },
    ],
    dataImpacts: ["PO module දැනට නැත; direct GRN draft stock වැඩි නොකරයි.", "Confirmed GRN පමණක් batch stock සහ payable සාදයි.", "Medicine sale FEFO අනුව ACTIVE, unexpired batches වලින් allocate වේ.", "Selling price batch MRP ඉක්මවන්නේ නම් sale block වේ.", "Completed sale පමණක් stock සහ revenue/COGS/gross profit reports update කරයි."],
    notices: [
      { tone: "warning", title: "Purchase Order නොමැත", body: "Current application එකේ PO page/service එක implement කර නැත. Training එක direct GRN workflow එක පමණක් භාවිතා කරයි." },
      { tone: "danger", title: "MRP සීමාව", body: "Medicine batch එකේ selling price MRP ට වැඩි නම් sale completion reject වේ." },
    ], checklist: ["Supplier active ද?", "Box=100, Strip=10, Tablet=1 conversions නිවැරදි ද?", "GRN DRAFT සිට CONFIRMED කළාද?", "Batch register එකේ stock පෙනේද?", "Receipt සහ Sales page එකේ completed sale පෙනේද?"],
    relatedLessons: ["scenario.loose-tablets", "scenario.fefo", "scenario.supplier-payment"],
    diagram: [
      { label: "Supplier", note: "ABC Pharmaceuticals" }, { label: "DRAFT GRN", note: "Stock 0 change" }, { label: "CONFIRMED GRN", note: "+1,000 Tablets" }, { label: "Batch", note: "PCM-2026-01" }, { label: "POS Sale", note: "FEFO allocation" }, { label: "Reports", note: "Revenue + COGS" },
    ],
  },
  {
    key: "scenario.general-item", slug: "general-item", kind: "scenario", category: "products", titleSi: "සාමාන්‍ය භාණ්ඩයක් විකිණීම", titleEn: "Grocery or general item sale", summarySi: "GENERAL_ITEM එකකට medicine-only prescription rules නොදමා stock කර විකිණීම.", difficulty: "beginner", estimatedMinutes: 14,
    businessContext: "Soap, bottled water හෝ baby-care item වැනි non-medicine products සඳහා prescription/controlled rules අවශ්‍ය නොවේ.", prerequisites: ["Product manage", "GRN manage", "POS access"], requiredPermissions: ["inventory.product.manage", "procurement.grn.manage", "pos.sale.create"], relatedRoute: "/products", relatedRouteLabel: "Products විවෘත කරන්න",
    steps: [
      { title: "GENERAL_ITEM Product එක create කරන්න", page: "Products", action: "Product type GENERAL_ITEM තෝරා base/sale units සකස් කරන්න.", fields: ["Name", "Product type", "Base unit", "Default selling price"], example: "Baby Soap · GENERAL_ITEM · Each", result: "Prescription rule NONE සහිත item එකක් සෑදේ." },
      { title: "Direct GRN එකෙන් stock ගන්න", page: "Goods Received", action: "Batch/expiry තිබේ නම් ඇතුළත් කරන්න; actual form එක optional ඉඩ දෙන විට හිස් තැබිය හැක.", result: "Confirm කළ පසු ACTIVE batch stock සහ payable සාදයි." },
      { title: "POS එකෙන් sale කරන්න", page: "Point of Sale", action: "Search කර cart එකට දමා payment complete කරන්න.", result: "Prescription prompt නැතිව completed sale එකෙන් stock අඩුවේ." },
    ], dataImpacts: ["GENERAL_ITEM වලට medicine MRP ceiling rule යෙදෙන්නේ නැත.", "Stock තවම batch සහ base-unit ledger මගින් track වේ."], notices: [{ tone: "info", title: "Medicine rules යොදන්න එපා", body: "General item එක controlled හෝ prescription-required ලෙස mark නොකරන්න." }], checklist: ["Product type GENERAL_ITEM ද?", "Unit conversion නිවැරදි ද?", "Confirmed GRN stock පෙනේද?"], relatedLessons: ["scenario.product-to-sale", "module.products"],
  },
  {
    key: "scenario.loose-tablets", slug: "loose-tablets", kind: "scenario", category: "pos", titleSi: "Loose tablets විකිණීම", titleEn: "Selling loose tablets", summarySi: "Box, Strip සහ Tablet quantity base units වලට පරිවර්තනය වන ආකාරය.", difficulty: "intermediate", estimatedMinutes: 12,
    businessContext: "Customer කෙනෙකුට full box එකක් අවශ්‍ය නොවන විට නිවැරදි unit එකෙන් sale කිරීම වැදගත්ය.", prerequisites: ["Tablet=1, Strip=10, Box=100 units configured", "Active unexpired stock"], requiredPermissions: ["pos.sale.read", "pos.sale.create"], relatedRoute: "/pos", relatedRouteLabel: "Point of Sale විවෘත කරන්න",
    steps: [
      { title: "Product එක cart එකට දාන්න", page: "Point of Sale", action: "Paracetamol 500mg search කර add කරන්න.", result: "Default sale unit සහ batch preview පෙන්වයි." },
      { title: "Tablet unit තෝරන්න", page: "Cart → Select unit", action: "Unit selector එකෙන් Tablet තෝරන්න.", example: "15 Tablet × Rs. 5.00 = Rs. 75.00", result: "qtyBase = 15 × factor 1 = 15 වේ." },
      { title: "Payment සම්පූර්ණ කරන්න", page: "Point of Sale", action: "Payment total එක sale total එකට සමාන කර complete කරන්න.", result: "Stock 15 base units අඩු කර money Decimal(12,2) ලෙස record කරයි." },
    ], dataImpacts: ["Quantity Decimal(14,3) වුවත් UI numeric input සහ business unit අනුව valid quantity දාන්න.", "Money floating-point නොව decimal rounding භාවිතා කරයි.", "Available base stock 15 ට අඩු නම් Insufficient stock error එකෙන් block වේ."], notices: [{ tone: "warning", title: "Unit එක දෙවරක් බලන්න", body: "15 Strip ලෙස දාන්නේ 150 Tablets බව මතක තබාගන්න." }], checklist: ["Tablet factor 1 ද?", "Quantity 15 ද?", "Total Rs. 75.00 ද?"], relatedLessons: ["scenario.fefo", "scenario.product-to-sale"],
  },
  {
    key: "scenario.fefo", slug: "fefo", kind: "scenario", category: "inventory", titleSi: "Batch කිහිපයක් සහ FEFO", titleEn: "Multiple batches and FEFO", summarySi: "ඉක්මනින් expire වන batch එකෙන් පළමුව sale allocate වන ආකාරය.", difficulty: "advanced", estimatedMinutes: 16,
    businessContext: "FEFO නිසා wastage අඩුවන අතර expired stock customer වෙත යාම වැළකේ.", prerequisites: ["Same medicine සඳහා ACTIVE batches දෙකක්", "Different expiry dates"], requiredPermissions: ["inventory.batch.read", "pos.sale.create"], relatedRoute: "/stock/batches", relatedRouteLabel: "Batch register විවෘත කරන්න",
    steps: [
      { title: "Batch dates සසඳන්න", page: "Stock → Batch register", action: "Batch A සහ Batch B expiry dates බලන්න.", example: "A: 2026-09-30, qty 20 · B: 2027-03-31, qty 100", result: "Batch A FEFO priority බව හඳුනාගනී." },
      { title: "30 Tablets sale කරන්න", page: "Point of Sale", action: "Quantity 30 දමා payment complete කරන්න.", result: "Server allocation Batch A වලින් 20 සහ Batch B වලින් 10 ගනී." },
      { title: "Movement records බලන්න", page: "Stock → Stock movements", action: "SALE_OUT rows batch අනුව පරීක්ෂා කරන්න.", result: "Batch දෙකට වෙනම ledger movements සහ cost snapshots පෙන්වයි." },
    ], dataImpacts: ["ACTIVE, unexpired, non-quarantined batches expiry ascending අනුව allocate වේ.", "First batch ප්‍රමාණවත් නොවේ නම් next FEFO batch එක භාවිතා වේ.", "Current POS UI එකේ manual batch override control එකක් නැත; එබැවින් override audit workflow එක unavailable."], notices: [{ tone: "warning", title: "Manual override නොමැත", body: "Current UI එකෙන් cashier ට batch තෝරා FEFO මාරු කළ නොහැක." }], checklist: ["Earlier expiry batch හඳුනාගත්තාද?", "Split allocation movement rows පරීක්ෂා කළාද?"], relatedLessons: ["scenario.loose-tablets", "module.batches"], diagram: [{ label: "Batch A", note: "20 · expires first" }, { label: "Batch B", note: "100 · expires later" }, { label: "Sale 30", note: "A 20 + B 10" }],
  },
  {
    key: "scenario.expiry", slug: "expiry", kind: "scenario", category: "expiry", titleSi: "Near-expiry සහ expired stock", titleEn: "Near-expiry and expired stock", summarySi: "Expiry alerts කියවීම සහ දැනට ලබා නොදෙන quarantine/write-off actions තේරුම් ගැනීම.", difficulty: "intermediate", estimatedMinutes: 12,
    businessContext: "Expired medicine sell නොකිරීම නීතිමය සහ patient-safety අවශ්‍යතාවයකි.", prerequisites: ["Stock read permission"], requiredPermissions: ["inventory.stock.read"], relatedRoute: "/stock/expiry", relatedRouteLabel: "Expiry alerts විවෘත කරන්න",
    steps: [
      { title: "Expiry alerts filter කරන්න", page: "Stock → Expiry alerts", action: "Product හෝ status filter එකෙන් batches බලන්න.", result: "Live expiry date අනුව near-expiry, expired සහ quarantined rows පෙන්වයි." },
      { title: "Expired batch POS එකේ භාවිතා නොකරන්න", page: "Point of Sale", action: "System allocation expired/quarantined batch exclude කරන බව තේරුම් ගන්න.", result: "Valid active stock නැත්නම් sale completion block වේ." },
      unavailableStep("Quarantine / Write-off action"),
    ], dataImpacts: ["Expiry alerts read-only.", "Schema එකේ QUARANTINED status සහ WRITE_OFF movement type ඇතත් operational mutation UI/service එක නැත.", "Expired stock delete කිරීම කිසිවිටෙක නිර්දේශ නොකරයි."], notices: [{ tone: "danger", title: "මෙය implementation gap එකකි", body: "Automatic quarantine සහ write-off workflow current application එකේ exposed නැත. Physical stock වෙන් කර administrator වෙත දැනුම් දෙන්න." }], checklist: ["Expired stock physical shelf එකෙන් වෙන් කළාද?", "Expiry alert evidence සටහන් කළාද?", "Administrator වෙත escalation කළාද?"], relatedLessons: ["module.expiry-alerts", "scenario.daily-operations"], diagram: [{ label: "ACTIVE", note: "Sellable if unexpired" }, { label: "Near expiry", note: "Alert only" }, { label: "QUARANTINED", note: "Schema status; no UI action" }, { label: "WRITE_OFF", note: "Movement type; no UI action" }],
  },
  {
    key: "scenario.customer-return", slug: "customer-return", kind: "scenario", category: "corrections", titleSi: "Customer return සහ refund", titleEn: "Customer return", summarySi: "Dedicated partial return feature එක නොමැති නිසා sale void සමඟ වෙනස හඳුනාගන්න.", difficulty: "intermediate", estimatedMinutes: 10, unavailable: true,
    businessContext: "Return, refund සහ void එකම දෙයක් නොවේ. Current system full completed-sale void එක පමණක් supports කරයි.", prerequisites: ["Original sale number", "Manager/pharmacist decision"], requiredPermissions: ["pos.sale.void"], relatedRoute: "/sales", relatedRouteLabel: "Sales විවෘත කරන්න",
    steps: [unavailableStep("Partial/full customer return"), { title: "Full sale void අවශ්‍යද තීරණය කරන්න", page: "Sales", action: "Original COMPLETED sale එක සොයා Void sale භාවිතා කරන්න.", fields: ["Void reason", "Refund method", "Refund reference", "Stock policy"], result: "Original sale තබා SaleVoid record, audit log සහ අවශ්‍ය stock reversal සාදයි." }],
    dataImpacts: ["Partial return quantity/refund workflow නැත.", "Full void refund amount full sale total එකයි.", "RETURN_TO_ACTIVE only item counter එකෙන් පිට නොගිය safe mistake සඳහා."], notices: [{ tone: "danger", title: "Returned medicine active stock වෙත දාන්න එපා", body: "Customer අතට ගිය medicine එක pharmacist safety decision නැතිව RETURN_TO_ACTIVE නොකරන්න." }], checklist: ["Original sale found ද?", "Dedicated return unavailable බව customer/manager ට පැහැදිලි කළාද?", "Void reason සටහන් කළාද?"], relatedLessons: ["scenario.sale-void", "module.sales"],
  },
  {
    key: "scenario.sale-void", slug: "sale-void", kind: "scenario", category: "corrections", titleSi: "වැරදි sale එකක් Void කිරීම", titleEn: "Incorrect sale or void", summarySi: "Completed transaction delete නොකර full void කිරීම.", difficulty: "intermediate", estimatedMinutes: 11,
    businessContext: "Audit trail සහ financial reports නිවැරදිව තබාගැනීමට completed sale එක delete නොකර reverse කළ යුතුය.", prerequisites: ["Sale COMPLETED status", "Void permission", "Reason"], requiredPermissions: ["pos.sale.void"], relatedRoute: "/sales", relatedRouteLabel: "Sales විවෘත කරන්න",
    steps: [
      { title: "Sale එක සොයන්න", page: "Sales", action: "Sale number, cashier/product, status හෝ date filters භාවිතා කරන්න.", result: "Original completed sale සහ payment breakdown පෙන්වයි." },
      { title: "Void sale click කරන්න", page: "Sales", action: "Void reason, refund method/reference සහ stock policy ඇතුළත් කරන්න.", result: "Only COMPLETED sale එකක් submit කළ හැක." },
      { title: "Confirm void කරන්න", page: "Sale void dialog", action: "Full refund total සහ policy review කර Confirm void කරන්න.", result: "Sale VOIDED, SaleVoid record සහ audit event සාදයි; RETURN_TO_ACTIVE නම් RETURN_IN movements සාදයි." },
    ], dataImpacts: ["Completed sale edit කිරීම supported නැත.", "NO_STOCK_RETURN default සහ safest policy.", "Revenue/report totals void status අනුව වෙනස් වේ; original record නොමැකේ."], notices: [{ tone: "warning", title: "Full void only", body: "Current phase එක partial line return හෝ partial refund support නොකරයි." }], checklist: ["Void permission තිබේද?", "Reason business evidence සමඟ දා තිබේද?", "Stock policy safe ද?"], relatedLessons: ["scenario.customer-return", "module.audit"],
  },
  {
    key: "scenario.controlled-drug", slug: "controlled-drug", kind: "scenario", category: "prescriptions", titleSi: "Controlled medicine sale", titleEn: "Controlled drug sale", summarySi: "Mandatory patient/prescriber capture සහ controlled register reporting.", difficulty: "advanced", estimatedMinutes: 18,
    businessContext: "Controlled medicine dispense කරන විට cashier/pharmacist actor සහ patient/prescriber details traceable විය යුතුය.", prerequisites: ["Controlled Product configured", "Controlled drug sale permission", "Patient identifier and prescriber registration"], requiredPermissions: ["controlled_drugs.sale.create", "pos.sale.create"], relatedRoute: "/pos", relatedRouteLabel: "Point of Sale විවෘත කරන්න",
    steps: [
      { title: "Controlled Product cart එකට දාන්න", page: "Point of Sale", action: "Product search කර quantity/unit review කරන්න.", result: "HARD_REQUIRED_CONTROLLED item count හඳුනාගනී." },
      { title: "Payment details දාන්න", page: "Payment", action: "Cash/Card/Split amount match කරන්න.", result: "Controlled details modal එක ඊළඟට විවෘත වේ." },
      { title: "Patient සහ prescriber details validate කරන්න", page: "Controlled medicine dialog", action: "Patient name සහ phone/NIC/reference එකක්; prescriber name සහ registration reference දාන්න.", result: "Skip කළ නොහැක; required fields නැත්නම් Continue disabled." },
      { title: "Sale complete කර register බලන්න", page: "Reports → Controlled drugs", action: "Sensitive report permission තිබේ නම් register එක බලන්න.", result: "Prescription, patient, prescriber සහ linked sale-line records සාදයි; register read audit logged වේ." },
    ], dataImpacts: ["Prescription image upload current MVP එකේ required හෝ implemented නැත.", "Controlled register viewing permission-gated සහ audit logged.", "Batch allocation still FEFO and sale stock rules apply."], notices: [{ tone: "danger", title: "Compliance අවවාදය", body: "වෙනත් සේවකයෙකුගේ account එක භාවිතා නොකරන්න. Patient/prescriber details අනුමාන කර නොදමන්න." }], checklist: ["Patient name සහ identifier තිබේද?", "Prescriber registration reference තිබේද?", "Correct cashier/pharmacist account ද?"], relatedLessons: ["scenario.prescription-rules", "module.reports"],
  },
  {
    key: "scenario.prescription-rules", slug: "prescription-rules", kind: "scenario", category: "prescriptions", titleSi: "Prescription rule තුන", titleEn: "Prescription-required medicine", summarySi: "NONE, PROMPT_SKIPPABLE සහ HARD_REQUIRED_CONTROLLED POS behavior.", difficulty: "beginner", estimatedMinutes: 9,
    businessContext: "Product-specific rule එක අනුව POS එකේ prescription handling වෙනස් වේ.", prerequisites: ["Products configured with prescription rules"], requiredPermissions: ["pos.sale.create"], relatedRoute: "/products", relatedRouteLabel: "Products විවෘත කරන්න",
    steps: [
      { title: "NONE", page: "Products / POS", action: "Prescription decision එකක් අවශ්‍ය නොවන product එක sale කරන්න.", example: "General item හෝ non-prescription medicine", result: "Payment පසු sale directly validate වේ." },
      { title: "PROMPT_SKIPPABLE", page: "POS", action: "Record prescription හෝ Skip prescription තෝරන්න; skip නම් reason දාන්න.", result: "Decision record/audit context සමඟ sale complete වේ." },
      { title: "HARD_REQUIRED_CONTROLLED", page: "POS", action: "Patient සහ prescriber required details සම්පූර්ණ කරන්න.", result: "Details නැතිව sale block වේ; skip option නැත." },
    ], dataImpacts: ["Controlled flag create කරන product එක HARD_REQUIRED_CONTROLLED ලෙස force වේ.", "Image upload optional text තිබුණත් storage capture UI current MVP එකේ නැත."], notices: [{ tone: "info", title: "Product-specific", body: "සියලු medicines එකම prescription behavior එක භාවිතා නොකරයි." }], checklist: ["Product rule හඳුනාගත්තාද?", "Skip reason අවශ්‍යද?", "Controlled permission තිබේද?"], relatedLessons: ["scenario.controlled-drug", "module.products"],
  },
  {
    key: "scenario.supplier-payment", slug: "supplier-payment", kind: "scenario", category: "payments", titleSi: "Supplier invoice සහ partial payments", titleEn: "Supplier invoice and payment", summarySi: "Rs. 100,000 invoice එක කොටස් වශයෙන් ගෙවා balance අඩු කිරීම.", difficulty: "intermediate", estimatedMinutes: 14,
    businessContext: "GRN confirm කරන විට payable එකක් සෑදෙන අතර සෑම payment එකක්ම වෙනම evidence record එකකි.", prerequisites: ["Confirmed GRN with supplier invoice", "Supplier payment permission"], requiredPermissions: ["suppliers.payments.read", "suppliers.payments.create"], relatedRoute: "/suppliers/payments", relatedRouteLabel: "Supplier Payments විවෘත කරන්න",
    steps: [
      { title: "Invoice balance එක තෝරන්න", page: "Supplier payments", action: "Supplier invoice dropdown එකෙන් Rs. 100,000 outstanding invoice එක තෝරන්න.", result: "Total, Paid, Outstanding සහ due date summary පෙන්වයි." },
      { title: "පළමු payment එක record කරන්න", page: "Record supplier payment", action: "Amount 40000, date, method සහ reference දාන්න.", result: "Payment 1 record; invoice PARTIALLY_PAID; outstanding Rs. 60,000." },
      { title: "දෙවන payment එක record කරන්න", page: "Record supplier payment", action: "Amount 35000 දාන්න.", result: "Payment 2 record; outstanding Rs. 25,000." },
      { title: "Remaining balance පරීක්ෂා කරන්න", page: "Supplier payments / Reports", action: "Open invoice row සහ payment history බලන්න.", result: "Rs. 25,000 තවම payable ලෙස පෙන්වයි; full settlement වන තුරු PAID නොවේ." },
    ], dataImpacts: ["Payment outstanding ඉක්මවන්නේ නම් block වේ.", "Each payment SupplierPayment record සහ audit logs දෙකක් ලියයි.", "Supplier payment expense report එකට ඇතුළත් නොවේ."], notices: [{ tone: "warning", title: "Duplicate payment වළක්වන්න", body: "Bank/receipt reference සහ payment history නැවත බලලා පමණක් record කරන්න." }], checklist: ["Correct invoice selected ද?", "40,000 + 35,000 = 75,000 ද?", "Remaining 25,000 ද?"], relatedLessons: ["scenario.product-to-sale", "module.supplier-payments"], diagram: [{ label: "Invoice", note: "100,000 OPEN" }, { label: "Payment 1", note: "−40,000" }, { label: "Payment 2", note: "−35,000" }, { label: "Balance", note: "25,000" }],
  },
  {
    key: "scenario.purchase-return", slug: "purchase-return", kind: "scenario", category: "purchasing", titleSi: "Supplier වෙත Purchase return", titleEn: "Purchase return to supplier", summarySi: "Current application එකේ purchase-return workflow එක implement කර නැත.", difficulty: "intermediate", estimatedMinutes: 4, unavailable: true,
    businessContext: "Supplier credit, stock reduction සහ original GRN link කිරීම සඳහා dedicated audited workflow අවශ්‍යය.", prerequisites: ["Administrator confirmation"], requiredPermissions: [], steps: [unavailableStep("Purchase return")], dataImpacts: ["No supplier-credit model or purchase-return route exists.", "Direct batch quantity edit කිරීම substitute එකක් නොවේ."], notices: [{ tone: "danger", title: "Manual workaround නොකරන්න", body: "Database row edit හෝ negative GRN එකක් දමා return simulate නොකරන්න." }], checklist: ["Administrator වෙත feature gap report කළාද?"], relatedLessons: ["scenario.product-to-sale"],
  },
  {
    key: "scenario.price-update", slug: "price-update", kind: "scenario", category: "products", titleSi: "Product price update", titleEn: "Product price update", summarySi: "Default price සහ batch-level price අතර වෙනස; current edit limitation.", difficulty: "intermediate", estimatedMinutes: 8, unavailable: true,
    businessContext: "පරණ සහ අලුත් batches වල cost, selling price සහ MRP වෙනස් විය හැක.", prerequisites: ["Product/batch knowledge"], requiredPermissions: ["inventory.product.manage"], relatedRoute: "/products", relatedRouteLabel: "Products විවෘත කරන්න",
    steps: [{ title: "Current prices බලන්න", page: "Products / Batch register", action: "Product default selling price සහ එක් එක් batch price/MRP compare කරන්න.", result: "Future GRN pricing සහ existing batch snapshots වෙනස් බව හඳුනාගනී." }, unavailableStep("Existing product or batch price edit")], dataImpacts: ["Create Product form supports default price; update UI/service exposed නැත.", "Medicine sale batch selling price MRP ඉක්මවිය නොහැක.", "Future sales preserve cost/MRP snapshots."], notices: [{ tone: "warning", title: "Existing batch edit නොමැත", body: "Batch table read-only බැවින් price update action එක training එකෙන් invent නොකරයි." }], checklist: ["Batch MRP ceiling checked ද?", "Administrator gap noted ද?"], relatedLessons: ["module.products", "module.batches"],
  },
  {
    key: "scenario.stock-adjustment", slug: "stock-adjustment", kind: "scenario", category: "inventory", titleSi: "Stock adjustment", titleEn: "Stock adjustment", summarySi: "Schema permission තිබුණත් operational adjustment action එක දැනට නැත.", difficulty: "advanced", estimatedMinutes: 6, unavailable: true,
    businessContext: "Adjustment එකක් ledger movement, reason සහ actor attribution සමඟ පමණක් කළ යුතුය.", prerequisites: ["Physical count evidence"], requiredPermissions: ["inventory.batch.adjust"], relatedRoute: "/stock/movements", relatedRouteLabel: "Stock movements බලන්න",
    steps: [unavailableStep("Stock adjustment")], dataImpacts: ["Stock pages explicitly read-only.", "ADJUSTMENT enum සහ permission තිබුණත් mutation service/page නැත.", "Negative stock is prevented in sale allocation."], notices: [{ tone: "danger", title: "Batch quantity direct edit තහනම්", body: "qtyOnHandBase projection එක manual DB edit නොකරන්න; source-of-truth movement ledger එක කඩවෙයි." }], checklist: ["Physical discrepancy documented ද?", "Administrator notified ද?"], relatedLessons: ["module.stock-movements", "scenario.expiry"],
  },
  {
    key: "scenario.daily-operations", slug: "daily-operations", kind: "scenario", category: "reports", titleSi: "Pharmacy එකේ එක් වැඩ දිනයක්", titleEn: "Daily pharmacy operation", summarySi: "Login සිට end-of-day reports සහ audit review දක්වා practical checklist එකක්.", difficulty: "beginner", estimatedMinutes: 24,
    businessContext: "දෛනික routine එකක් තිබීමෙන් missed expiry alerts, unpaid invoices සහ cash/report differences අඩු වේ.", prerequisites: ["Own user account", "Role-based menu access"], requiredPermissions: [], relatedRoute: "/dashboard", relatedRouteLabel: "Dashboard විවෘත කරන්න",
    steps: [
      { title: "Login සහ Dashboard alerts", page: "Login → Dashboard", action: "Own username/password භාවිතා කර today sales, low stock, near expiry සහ payables බලන්න.", result: "දවසේ priority list එක සකස් වේ." },
      { title: "Delivery receive කරන්න", page: "Goods Received", action: "Supplier delivery එක DRAFT GRN ලෙස save කර detail review පසු confirm කරන්න.", result: "Stock, movement සහ payable update වේ." },
      { title: "Customer sales කරන්න", page: "Point of Sale", action: "Units, prescription decisions සහ payments නිවැරදිව complete කරන්න.", result: "Completed sales stock සහ reports update කරයි." },
      { title: "Correction අවශ්‍ය නම් full void process කරන්න", page: "Sales", action: "Permission තිබේ නම් reason සහ safe stock policy සමඟ void කරන්න.", result: "Audit-preserving reversal එකක් සිදු වේ." },
      { title: "Expense සහ supplier payment වෙන්ව record කරන්න", page: "Expenses / Supplier Payments", action: "Rent/electricity Expenses තුළ; invoice settlement Supplier Payments තුළ දාන්න.", result: "Operating expense සහ AP settlement reports මිශ්‍ර නොවේ." },
      { title: "End-of-day review", page: "Reports / Audit Logs", action: "Daily sales, payment totals, gross profit, expenses, payables සහ sensitive actions review කරන්න.", result: "Cash/payment mismatch සහ unusual activity හඳුනාගත හැක." },
    ], dataImpacts: ["Dashboard/report numbers real PostgreSQL transactions මත පදනම් වේ.", "Gross profit uses batch cost captured at sale.", "Audit log access itself permission-gated."], notices: [{ tone: "info", title: "Print කරන්න", body: "මෙම lesson එක print කළ විට navigation සඟවා checklist එක පමණක් භාවිතා කළ හැක." }], checklist: ["Dashboard alerts checked", "GRNs reviewed before confirm", "Prescription/controlled sales complete", "Expenses and supplier payments separated", "Sales/payment totals reviewed", "Outstanding payables checked", "Audit activity checked", "Logout completed"], relatedLessons: ["scenario.product-to-sale", "scenario.supplier-payment", "module.reports"],
  },
  {
    key: "scenario.new-employee", slug: "new-employee", kind: "scenario", category: "security", titleSi: "අලුත් employee/user කෙනෙකු සකස් කිරීම", titleEn: "New employee or user setup", summarySi: "Role සහ permission bundle නිවැරදිව assign කර shared account වළක්වන්න.", difficulty: "intermediate", estimatedMinutes: 13,
    businessContext: "සෑම stock, sale, payment සහ admin action එකක actor නිවැරදිව දැනගැනීමට එක් සේවකයෙකුට එක් account එකක් තිබිය යුතුය.", prerequisites: ["Admin users manage permission", "Role exists"], requiredPermissions: ["admin.users.manage", "admin.roles.manage"], relatedRoute: "/admin/users", relatedRouteLabel: "Users විවෘත කරන්න",
    steps: [
      { title: "Role responsibilities තීරණය කරන්න", page: "Roles", action: "Cashier, pharmacist, owner/admin duty අනුව least permissions තෝරන්න.", result: "Permission bundle එක business duty එකට ගැළපේ." },
      { title: "User create කරන්න", page: "Users → New user", action: "Name, username, password, phone, role සහ pharmacist fields අවශ්‍ය නම් දාන්න.", result: "Active user account එක role link සමඟ සාදයි." },
      { title: "Visible menus verify කරන්න", page: "Login", action: "New employee account එකෙන් login කර expected menus පමණක් පෙනෙන බව බලන්න.", result: "Unauthorized operational links sidebar එකේ නොපෙනේ; server guard ද යෙදේ." },
    ], dataImpacts: ["User actions actor ID සමඟ audit/transaction records වලට link වේ.", "Owner role full permission set retain කළ යුතුය.", "Shared account actor attribution විනාශ කරයි."], notices: [{ tone: "danger", title: "Shared login භාවිතා නොකරන්න", body: "Password share කිරීමෙන් controlled sales, voids සහ payments කවුද කළේද සනාථ කළ නොහැක." }], checklist: ["Unique username ද?", "Least-privilege role ද?", "Pharmacist registration fields accurate ද?", "Login/menu test passed ද?"], relatedLessons: ["module.users", "module.roles", "module.audit"],
  },
];

type ModuleSeed = { slug: string; category: string; titleSi: string; titleEn: string; route?: string; permission?: string; purpose: string; fields: string[]; buttons: string[]; statuses?: string[]; mistakes: string[] };

const moduleSeeds: ModuleSeed[] = [
  { slug: "login", category: "setup", titleSi: "Login", titleEn: "Login", route: "/login", purpose: "Staff account එකෙන් secure session එකක් ආරම්භ කිරීම.", fields: ["Username", "Password"], buttons: ["Sign in"], mistakes: ["වෙනත් සේවක account එක භාවිතා කිරීම", "Password share කිරීම"] },
  { slug: "dashboard", category: "reports", titleSi: "Dashboard", titleEn: "Dashboard", route: "/dashboard", permission: "reports.dashboard.read", purpose: "Today sales, payment mix, gross profit, stock alerts, expenses සහ payables snapshot බැලීම.", fields: [], buttons: ["View report links"], mistakes: ["Date context නොබලා totals compare කිරීම"] },
  { slug: "products", category: "products", titleSi: "Products", titleEn: "Products", route: "/products", permission: "inventory.product.manage", purpose: "Medicine සහ GENERAL_ITEM catalogue, units, barcode සහ prescription rules create කිරීම.", fields: ["Name", "Generic name", "Strength", "Form", "Product type", "Category", "Base unit", "Prescription rule", "Controlled", "Default selling price", "Reorder level", "Units"], buttons: ["Create product", "Add unit"], mistakes: ["Factor to base වැරදි කිරීම", "Duplicate barcode", "Controlled flag අමතක කිරීම"] },
  { slug: "suppliers", category: "suppliers", titleSi: "Suppliers", titleEn: "Suppliers", route: "/suppliers", permission: "suppliers.manage", purpose: "Supplier contact, credit terms සහ active status පවත්වාගැනීම.", fields: ["Name", "Contact person", "Phone", "Email", "Address", "Credit term days"], buttons: ["Add supplier", "Supplier Payments"], statuses: ["ACTIVE", "INACTIVE"], mistakes: ["Same supplier දෙවරක් create කිරීම", "Credit days වැරදි කිරීම"] },
  { slug: "grn", category: "grn", titleSi: "Goods Received Notes", titleEn: "Goods Received", route: "/stock/grn", permission: "procurement.grn.manage", purpose: "Direct supplier delivery එක draft කර review පසු stock සහ payable ලෙස confirm කිරීම.", fields: ["Supplier", "Product", "Unit", "Quantity", "Batch", "Expiry", "MRP", "Cost", "Selling price", "Notes"], buttons: ["New GRN", "Save draft", "Confirm GRN"], statuses: ["DRAFT", "CONFIRMED", "CANCELLED"], mistakes: ["Wrong batch confirm කිරීම", "Expiry/MRP නොබලා confirm කිරීම"] },
  { slug: "batches", category: "inventory", titleSi: "Batch register", titleEn: "Batches", route: "/stock/batches", permission: "inventory.stock.read", purpose: "Batch-level quantity, expiry, cost, price, MRP සහ status read-only ලෙස බැලීම.", fields: ["Search", "Status filter"], buttons: ["Filter"], statuses: ["ACTIVE", "QUARANTINED", "DEPLETED"], mistakes: ["Batch quantity editable බව සිතීම", "Expiry නොබලා active ලෙස අර්ථකථනය කිරීම"] },
  { slug: "stock-movements", category: "inventory", titleSi: "Stock movements", titleEn: "Stock movements", route: "/stock/movements", permission: "inventory.stock.read", purpose: "Batch stock වෙනස් වූ ledger evidence බැලීම.", fields: ["Search", "Movement type"], buttons: ["Filter"], statuses: ["GRN_IN", "SALE_OUT", "RETURN_IN", "WRITE_OFF", "ADJUSTMENT"], mistakes: ["qtyOnHandBase එක පමණක් source of truth ලෙස ගැනීම"] },
  { slug: "expiry-alerts", category: "expiry", titleSi: "Expiry alerts", titleEn: "Expiry alerts", route: "/stock/expiry", permission: "inventory.stock.read", purpose: "Expired, quarantined සහ near-expiry batches date අනුව හඳුනාගැනීම.", fields: ["Search", "Status"], buttons: ["Filter"], mistakes: ["Alert එක quarantine action එකක් බව සිතීම"] },
  { slug: "pos", category: "pos", titleSi: "Point of Sale", titleEn: "Point of Sale", route: "/pos", permission: "pos.sale.read", purpose: "Product/barcode search, unit selection, prescription decision සහ payment මගින් sale complete කිරීම.", fields: ["Search", "Barcode", "Quantity", "Unit", "Payment", "Prescription decision"], buttons: ["Add", "Select unit", "Cash", "Card", "Split", "Complete sale"], mistakes: ["Wrong unit", "Payment mismatch", "Prescription details skip කිරීම"] },
  { slug: "sales", category: "corrections", titleSi: "Sales history", titleEn: "Sales", route: "/sales", permission: "pos.sale.create", purpose: "Sale status, lines, payments සහ permission තිබේ නම් full void review කිරීම.", fields: ["Sale number/product", "Status", "From", "To"], buttons: ["Apply filters", "New sale", "Void sale"], statuses: ["HELD", "COMPLETED", "VOIDED"], mistakes: ["Completed sale delete කිරීමට උත්සාහ කිරීම", "Unsafe RETURN_TO_ACTIVE"] },
  { slug: "supplier-payments", category: "payments", titleSi: "Supplier payments", titleEn: "Supplier payments", route: "/suppliers/payments", permission: "suppliers.payments.read", purpose: "Outstanding supplier invoice සඳහා separate partial/full payments record කිරීම.", fields: ["Supplier invoice", "Payment date", "Amount", "Payment method", "Reference", "Notes"], buttons: ["Record payment"], statuses: ["OPEN", "PARTIALLY_PAID", "PAID", "CANCELLED"], mistakes: ["Outstanding ඉක්මවන payment", "Expense ලෙස record කිරීම"] },
  { slug: "expenses", category: "expenses", titleSi: "Expenses", titleEn: "Expenses", route: "/expenses", permission: "expenses.read", purpose: "Rent, utilities, salary සහ other operating costs record කිරීම.", fields: ["Expense date", "Category", "Amount", "Payment method", "Description", "Reference", "Notes"], buttons: ["Add expense"], mistakes: ["Supplier payment expense ලෙස දාන්න", "Receipt reference අමතක කිරීම"] },
  { slug: "reports", category: "reports", titleSi: "Reports", titleEn: "Reports", route: "/reports", permission: "reports.read", purpose: "Sales, stock, gross profit, supplier payables/payments, expenses සහ controlled register බලන්න.", fields: ["Report", "From", "To"], buttons: ["Apply filters"], mistakes: ["Voided sales/date range නොබලා totals compare කිරීම"] },
  { slug: "users", category: "security", titleSi: "Users", titleEn: "Users", route: "/admin/users", permission: "admin.users.manage", purpose: "Individual staff accounts create/update කිරීම.", fields: ["Name", "Username", "Password", "Phone", "Role", "Active", "Pharmacist fields"], buttons: ["New user", "Save"], mistakes: ["Shared user create කිරීම", "Unnecessary admin role assign කිරීම"] },
  { slug: "roles", category: "security", titleSi: "Roles", titleEn: "Roles", route: "/admin/roles", permission: "admin.roles.manage", purpose: "Permission bundles role responsibility අනුව assign කිරීම.", fields: ["Code", "Name", "Description", "Permissions"], buttons: ["New role", "Save role"], mistakes: ["Owner permissions remove කිරීම", "Least privilege නොසලකා හැරීම"] },
  { slug: "permissions", category: "security", titleSi: "Permissions", titleEn: "Permissions", route: "/admin/permissions", permission: "admin.permissions.read", purpose: "Seeded permission registry read-only ලෙස බැලීම.", fields: ["Module", "Resource", "Action", "Sensitive"], buttons: [], mistakes: ["Registry page එකෙන් direct edit කළ හැකි බව සිතීම"] },
  { slug: "audit", category: "security", titleSi: "Audit Logs", titleEn: "Audit Logs", route: "/admin/audit", permission: "audit.read", purpose: "Important mutations සහ sensitive reads actor/time/data context සමඟ review කිරීම.", fields: ["Actor", "Action", "Entity", "Date"], buttons: ["Filter"], mistakes: ["Audit record operational transaction එකට substitute කිරීම"] },
  { slug: "settings", category: "setup", titleSi: "Settings", titleEn: "Settings", route: "/admin/settings", permission: "admin.settings.manage", purpose: "Current settings workspace බැලීම; implemented controls පමණක් භාවිතා කිරීම.", fields: [], buttons: [], mistakes: ["Unavailable configuration invent කිරීම"] },
  { slug: "troubleshooting", category: "troubleshooting", titleSi: "ගැටලු විසඳීම", titleEn: "Troubleshooting", route: "/training/troubleshooting", purpose: "Actual validation message එකෙන් reason, check, fix සහ escalation තීරණය කිරීම.", fields: ["Issue", "Possible reason", "How to check", "How to fix"], buttons: ["Open troubleshooting guide"], mistakes: ["Ledger evidence නොබලා database value edit කිරීම", "Permission error එක stock error එකක් ලෙස අර්ථකථනය කිරීම"] },
];

export const moduleLessons: TrainingLesson[] = moduleSeeds.map((seed) => ({
  key: `module.${seed.slug}`, slug: seed.slug, kind: "module", category: seed.category, titleSi: seed.titleSi, titleEn: seed.titleEn,
  summarySi: seed.purpose, difficulty: seed.category === "security" ? "intermediate" : "beginner", estimatedMinutes: 7,
  businessContext: seed.purpose, prerequisites: [seed.permission ? `Permission: ${seed.permission}` : "Authenticated staff account"], requiredPermissions: seed.permission ? [seed.permission] : [],
  relatedRoute: seed.route, relatedRouteLabel: seed.route ? `${seed.titleEn} විවෘත කරන්න` : undefined,
  steps: [
    { title: "Page එක විවෘත කරන්න", page: seed.titleEn, action: seed.route ? `Sidebar එකෙන් ${seed.titleEn} තෝරන්න.` : "Applicable page එක විවෘත කරන්න.", result: "Permission තිබේ නම් page එක පෙන්වයි; නැත්නම් forbidden page එකට යයි." },
    { title: "Main fields හඳුනාගන්න", page: seed.titleEn, action: seed.fields.length ? seed.fields.join(" · ") : "Page summary සහ available data review කරන්න.", result: "දත්ත ඇතුළත් කිරීමට පෙර field purpose තේරුම් ගනී." },
    { title: "Available action පමණක් භාවිතා කරන්න", page: seed.titleEn, action: seed.buttons.length ? seed.buttons.join(" · ") : "මෙම page එක read-only ලෙස භාවිතා කරන්න.", result: "Current application behavior එකට පමණක් ක්‍රියා කරයි." },
  ],
  dataImpacts: [seed.statuses?.length ? `Statuses: ${seed.statuses.join(", ")}` : "Page-specific records පමණක් create/update වේ.", `Related permission: ${seed.permission ?? "authenticated access"}`],
  notices: [{ tone: "warning", title: "පොදු වැරදි", body: seed.mistakes.join("; ") }], checklist: ["Correct page එකද?", "Required permission තිබේද?", "Submit කිරීමට පෙර entered values නැවත බැලුවාද?"], relatedLessons: [],
}));

export const allTrainingLessons = [...scenarioLessons, ...moduleLessons];
export const lessonByKey = new Map(allTrainingLessons.map((lesson) => [lesson.key, lesson]));

export function searchTrainingLessons(query: string, lessons: TrainingLesson[] = allTrainingLessons) {
  const normalized = query.trim().toLocaleLowerCase("si");
  if (!normalized) return lessons;
  return lessons.filter((lesson) =>
    `${lesson.titleSi} ${lesson.titleEn} ${lesson.summarySi} ${lesson.category}`
      .toLocaleLowerCase("si")
      .includes(normalized),
  );
}

export function findTrainingLesson(kind: string, slug: string) {
  const normalizedKind = kind === "scenarios" ? "scenario" : kind === "modules" ? "module" : null;
  return normalizedKind ? allTrainingLessons.find((lesson) => lesson.kind === normalizedKind && lesson.slug === slug) : undefined;
}

export const glossary = [
  ["Batch", "එකම නිෂ්පාදන වාරයකට අයත් stock කොටස.", "PCM-2026-01 Paracetamol batch එක."],
  ["Expiry", "භාවිතයට සුදුසු කාලය අවසන් වන දිනය.", "2027-03-31 පසු batch එක sell නොකරයි."],
  ["FEFO", "First Expiry, First Out — කලින් expire වන stock පළමුව.", "Batch A, Batch B ට පෙර allocate වේ."],
  ["MRP", "Medicine batch එකේ උපරිම retail price.", "MRP Rs. 5 නම් Rs. 5 ට වැඩිව sell කිරීම block වේ."],
  ["Base unit", "Stock ගණනය කරන කුඩාම මූලික unit එක.", "Tablet."],
  ["Conversion factor", "Selected unit එක base units කීයක්ද කියන අගය.", "Strip=10, Box=100."],
  ["GRN", "Supplier delivery එක භාරගත් බව සටහන් කරන Goods Received Note.", "Confirm කළ විට stock වැඩි වේ."],
  ["Supplier payable", "Supplier invoice එකට තව ගෙවිය යුතු මුදල.", "100,000 − 75,000 = 25,000."],
  ["Stock movement", "Batch stock වෙනසට append-only ledger evidence.", "GRN_IN +1000 හෝ SALE_OUT −15."],
  ["Quarantine", "Sale කළ නොහැකි ලෙස stock වෙන් කිරීම.", "Expired batch එක."],
  ["Write-off", "Sell කළ නොහැකි stock audited loss එකක් ලෙස ඉවත් කිරීම.", "Current UI action unavailable."],
  ["COGS", "විකුණූ batch stock එකේ actual cost.", "Gross profit ගණනයට භාවිතා වේ."],
  ["Void", "Completed sale එක delete නොකර full reversal කිරීම.", "Reason සහ actor සමඟ."],
  ["Audit log", "කවුද, කවදා, කුමන වැදගත් action එක කළේද කියන record එක.", "Sale void හෝ supplier payment."],
  ["Role", "සේවක වගකීම් අනුව permission bundle එක.", "Cashier, Pharmacist, Owner."],
] as const;

export const troubleshooting = [
  { issue: "Product POS එකේ නොපෙනේ", reasons: "Product inactive, sale unit නැත, search term/barcode වැරදියි.", check: "Products page එකේ active product, units සහ barcode බලන්න.", fix: "Valid sale unit/barcode සමඟ product setup කරන්න.", admin: "Product update UI අවශ්‍ය නම් admin." },
  { issue: "Stock zero ලෙස පෙනේ", reasons: "GRN DRAFT, batch depleted, expired/quarantined හෝ conversion වැරදියි.", check: "GRN status, Batch register සහ Stock movements බලන්න.", fix: "Correct GRN එක confirm කරන්න; ledger evidence නැතිව quantity edit නොකරන්න.", admin: "Confirmed GRN movement නොපෙනේ නම් admin." },
  { issue: "Selling price exceeds MRP", reasons: "Medicine batch selling price MRP ceiling ඉක්මවයි.", check: "Batch register එකේ Selling price සහ MRP compare කරන්න.", fix: "Sale නවත්වන්න; current batch price-edit gap admin වෙත escalate කරන්න.", admin: "Always." },
  { issue: "Insufficient stock", reasons: "Requested base quantity available FEFO stock ට වැඩියි.", check: "Selected unit factor සහ batch quantities බලන්න.", fix: "Quantity අඩු කරන්න හෝ confirmed GRN එකකින් valid stock ලබාගන්න.", admin: "Ledger mismatch නම්." },
  { issue: "Prescription / patient / prescriber required", reasons: "Product PROMPT_SKIPPABLE හෝ HARD_REQUIRED_CONTROLLED.", check: "Product prescription rule බලන්න.", fix: "Prompt decision හෝ accurate patient/prescriber details දාන්න.", admin: "Rule setup වැරදි නම්." },
  { issue: "GRN confirm කළ නොහැක", reasons: "Not DRAFT, invalid medicine batch/expiry/MRP, missing lines හෝ permission නැත.", check: "GRN detail සහ form validation බලන්න.", fix: "Draft data correct කර permission holder සමඟ confirm කරන්න.", admin: "Confirmed/cancelled state conflict නම්." },
  { issue: "Payment exceeds balance", reasons: "Amount invoice outstanding ට වැඩියි.", check: "Supplier payments summary එකේ Outstanding බලන්න.", fix: "Amount outstanding දක්වා අඩු කරන්න.", admin: "Duplicate/missing payment history නම්." },
  { issue: "Report total බලාපොරොත්තු වූ අගයට නොගැළපේ", reasons: "Date range, VOIDED sale, payment method, expense/AP distinction හෝ no completed data.", check: "Filters, sale status, movement/payments සහ report type බලන්න.", fix: "Same date/status scope එකෙන් නැවත compare කරන්න.", admin: "Source rows match නමුත් summary mismatch නම්." },
];
