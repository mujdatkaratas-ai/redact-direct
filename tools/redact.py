#!/usr/bin/env python3
"""Redact Direct — local PDF redaction script.

Reads a PDF, identifies and redacts personal data, outputs a redacted copy.
Uses PyMuPDF (fitz) for text extraction, regex matching, and redaction annotations.
"""

import re
import sys
import pymupdf  # PyMuPDF
from pathlib import Path

# ─── Redaction patterns (regex) ───
PATTERNS = [
    (r'\b\d{8}\b', 'account number'),
    (r'\b\d{2}-\d{2}-\d{2}\b', 'sort code'),
    (r'\bGB\d{2}[A-Z]{4}\d{14}\b', 'IBAN'),
    (r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', 'email'),
    (r'\b0\d{10}\b', 'phone'),
    (r'\b07\d{9}\b', 'mobile'),
    (r'\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b', 'postcode'),
    (r'\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b', 'card number'),
    (r'£[\d,]+\.\d{2}', 'balance'),
    (r'\b[A-Z]{2}\d{6}[A-Z]\b', 'NI number'),
]

# Name patterns — look for titles + names
NAME_PATTERNS = [
    r'(?i)\b(?:Mr|Mrs|Miss|Ms|Dr|Prof)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+',
]

def redact_pdf(input_path: str, output_path: str) -> dict:
    """Redact personal data from a PDF and return a summary."""
    doc = pymupdf.open(input_path)
    redaction_count = 0
    types_redacted = set()
    page_count = len(doc)

    for page in doc:
        # Extract all text from the page
        full_text = page.get_text("text")

        # Check each pattern against the full text
        for pattern, label in PATTERNS:
            for match in re.finditer(pattern, full_text):
                matched_text = match.group()
                # Find this text on the page and redact it
                rects = page.search_for(matched_text)
                for rect in rects:
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                    redaction_count += 1
                    types_redacted.add(label)

        # Check name patterns
        for pattern in NAME_PATTERNS:
            for match in re.finditer(pattern, full_text):
                matched_text = match.group()
                rects = page.search_for(matched_text)
                for rect in rects:
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                    redaction_count += 1
                    types_redacted.add("name")

    # Apply all redactions
    for page in doc:
        page.apply_redactions()

    # Save
    output_path_obj = Path(output_path)
    output_path_obj.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path_obj))
    doc.close()

    return {
        "redactions": redaction_count,
        "types": sorted(types_redacted),
        "pages": page_count,
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python redact.py <input.pdf> <output.pdf>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    result = redact_pdf(input_path, output_path)
    print(f"Redacted {result['redactions']} instances across {result['pages']} page(s)")
    print(f"Types: {', '.join(result['types']) if result['types'] else 'none found'}")
    print(f"Output: {output_path}")
