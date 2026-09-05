#!/usr/bin/env python3
"""Extract the complete NMRA medicine table and produce identity-only import data."""
from __future__ import annotations

import csv
import json
import re
import shutil
from pathlib import Path

import pdfplumber

SOURCE = Path("/tmp/nmra/nmra.pdf")
OUT = Path("imports/nmra")

# pdfplumber drops the first row on pages whose table header is visually
# continued from the previous page. These values are taken from the same PDF's
# extracted page text and retained in raw evidence with their source page.
FALLBACK = {
    14: ("Aminophylline", "Injection", "25 mg/mL", 2),
    31: ("Abiraterone", "Tablet", "500 mg", 3),
    47: ("Carbamazepine", "Tablet", "100 mg", 4),
    64: ("Darbepoetin Alfa", "Injection", "25 mcg/0.42 mL", 5),
    80: ("Etomidate", "Injection", "20 mg/10 mL", 6),
    95: ("Gabapentin", "Capsule", "100 mg", 7),
    111: ("Influenza vaccine (inactivated surface antigen)", "Injection", "15 mcg/0.5 mL", 8),
    127: ("Levetiracetam", "Tablet", "750 mg", 9),
    142: ("Mitomycin", "Injection", "2 mg", 10),
    158: ("Telmisartan", "Tablet", "20 mg", 11),
    174: ("Fentanyl", "Injection", "100 mcg/2 mL", 12),
    190: ("Pneumococcal Polysaccharide Conjugate Vaccine (Adsorbed) 10 valent", "Injection", "5 doses/vial", 13),
    197: ("Human Normal Immunoglobulin", "Infusion", "100g/1000mL", 14),
    213: ("Rosuvastatin", "Tablet", "10 mg", 15),
    229: ("Sildenafil", "Tablet", "50 mg", 16),
    245: ("Azathioprine", "Tablet", "50 mg", 17),
    262: ("Trimetazidine", "Tablet (modified release)", "35 mg", 18),
    276: ("Abacavir", "Tablet", "300 mg", 19),
    291: ("Atorvastatin", "Tablet", "40 mg", 20),
    303: ("Brimonidine Tartrate + Timolol", "Eye Drops", "2 mg/mL + 5 mg/mL", 21),
    314: ("Carvedilol", "Tablet", "12.5 mg", 22),
    330: ("Cholecalciferol", "Tablet", "1000 IU", 23),
    343: ("Dapagliflozin", "Tablet", "10 mg", 24),
}

def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("\n", " ")).strip()

def display_words(value: str) -> str:
    value = clean(value).lower()
    value = re.sub(r"\s*\+\s*", " + ", value)
    return " ".join(part[:1].upper() + part[1:] for part in value.split(" "))

def normalize_strength(value: str) -> str:
    value = clean(value).replace(" / ", "/").replace(" /", "/").replace("/ ", "/")
    value = re.sub(r"(?i)(\d)\s*(mg|mcg|g|ml|iu|%)(?![a-z])", lambda m: f"{m.group(1)} {m.group(2)}", value)
    value = re.sub(r"\s*\+\s*", " + ", value)
    return value

def normalize_form(value: str) -> str:
    value = clean(value)
    return display_words(value) if value else ""

def canonical(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())

def base_uom(form: str) -> tuple[str, str]:
    low = form.lower()
    if low.startswith("tablet") and "capsule" not in low:
        return "Tablet", "Explicit tablet dosage form."
    if low.startswith("capsule"):
        return "Capsule", "Explicit capsule dosage form."
    if "suppository" in low:
        return "Suppository", "Explicit suppository dosage form."
    if "oral drops" in low or low in {"eye drops", "eye/ear drop"}:
        return "Drops", "Explicit drops dosage form."
    if low == "inhaler" or "pressurized inhalation" in low:
        return "Inhaler", "Explicit inhaler presentation."
    return "Piece", "Neutral base unit; commercial presentation is not unambiguous from the source."

def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE, OUT / "nmra_medicines_2025_11_17_source.pdf")
    raw_rows: list[dict[str, object]] = []
    with pdfplumber.open(SOURCE) as document:
        for page_no, page in enumerate(document.pages, 1):
            for table in page.extract_tables():
                for row in table:
                    if row and row[0] and re.fullmatch(r"\d+", clean(row[0])):
                        values = [clean(v) for v in row]
                        raw_rows.append({
                            "source_row": int(values[0]),
                            "source_page": page_no,
                            "generic_name_raw": values[1] if len(values) > 1 else "",
                            "dosage_form_raw": values[2] if len(values) > 2 else "",
                            "strength_raw": values[3] if len(values) > 3 else "",
                            "raw_columns": values,
                            "source_mrp_raw": values[-1] if len(values) >= 8 else "",
                            "extraction_method": "pdfplumber_table",
                        })
    by_no = {int(row["source_row"]): row for row in raw_rows}
    for number, (generic, form, strength, page_no) in FALLBACK.items():
        if number not in by_no:
            by_no[number] = {
                "source_row": number, "source_page": page_no,
                "generic_name_raw": generic, "dosage_form_raw": form,
                "strength_raw": strength, "raw_columns": [str(number), generic, form, strength],
                "source_mrp_raw": "", "extraction_method": "pdfplumber_page_text_fallback",
            }
    raw_rows = [by_no[n] for n in sorted(by_no)]

    with (OUT / "nmra_medicines_2025_11_17_raw.csv").open("w", newline="", encoding="utf-8") as stream:
        fields = ["source_row", "source_page", "generic_name_raw", "dosage_form_raw", "strength_raw", "source_mrp_raw", "extraction_method", "raw_columns"]
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for row in raw_rows:
            writer.writerow({**row, "raw_columns": json.dumps(row["raw_columns"], ensure_ascii=False)})

    normalized: dict[str, dict[str, object]] = {}
    manual: list[dict[str, object]] = []
    for row in raw_rows:
        generic = display_words(str(row["generic_name_raw"]))
        form = normalize_form(str(row["dosage_form_raw"]))
        strength = normalize_strength(str(row["strength_raw"]))
        if not generic or generic == "-" or not form or form == "-" or not strength or strength == "-":
            manual.append({**row, "reason": "Missing generic name, dosage form, or strength."})
            continue
        unit, unit_note = base_uom(form)
        key = "|".join([canonical(generic), canonical(strength), canonical(form)])
        item = normalized.setdefault(key, {
            "source_row": row["source_row"], "source_rows": str(row["source_row"]),
            "source_page": row["source_page"], "generic_name": generic,
            "strength": strength, "dosage_form": form, "route": "",
            "base_uom": unit, "canonical_key": key,
            "matched_product_id": "", "import_status": "PENDING",
            "notes": unit_note,
        })
        if item["source_rows"] != str(row["source_row"]):
            item["source_rows"] += f",{row['source_row']}"

    fields = ["source_row", "source_rows", "source_page", "generic_name", "strength", "dosage_form", "route", "base_uom", "canonical_key", "matched_product_id", "import_status", "notes"]
    with (OUT / "nmra_medicines_2025_11_17_normalized.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader(); writer.writerows(normalized.values())
    (OUT / "nmra_medicines_2025_11_17_normalized.json").write_text(json.dumps(list(normalized.values()), ensure_ascii=False, indent=2), encoding="utf-8")
    with (OUT / "nmra_medicines_manual_review.csv").open("w", newline="", encoding="utf-8") as stream:
        fields_manual = ["source_row", "source_page", "generic_name_raw", "dosage_form_raw", "strength_raw", "reason"]
        writer = csv.DictWriter(stream, fieldnames=fields_manual)
        writer.writeheader(); writer.writerows({field: row.get(field, "") for field in fields_manual} for row in manual)
    print(json.dumps({"source_rows": len(raw_rows), "parsed_rows": len(raw_rows) - len(manual), "unique_formulations": len(normalized), "manual_review": len(manual), "mrp_fields_selected_for_import": 0, "missing_source_numbers": sorted(set(range(1, 351)) - set(by_no))}, indent=2))

if __name__ == "__main__":
    main()
