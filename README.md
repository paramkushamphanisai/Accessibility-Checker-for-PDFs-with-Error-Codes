# PDF Accessibility Checker (Enhanced Version)

A modern, client-side web tool for analyzing PDF accessibility in batch — designed to not only detect accessibility status, but also **identify and explain specific accessibility issues** found within each document.

This tool is optimized for institutional workflows (e.g., Sunapsis EForms, compliance audits, and document reviews) and provides clear, actionable insights.

---

## 🚀 Features

- **Batch upload support**
  - Upload multiple PDF files at once
  - Supports `.pdf`, `.p7m`, `.pdf.p7m`

- **Detailed Accessibility Analysis**
  - Detects if text is selectable and readable
  - Identifies image-heavy (scanned) documents
  - Evaluates text quality and structure

- **Accessibility Issue Detection (NEW)**
  Each document includes a breakdown of issues such as:
  - No readable text (image-only PDFs)
  - High image content percentage
  - Very low text density
  - Possible OCR issues (text present but insufficient)

- **Visual Indicators**
  - 🟢 Accessible
  - 🔴 Not Accessible
  - 🟡 Signed PDF (unsupported extraction)

<img width="800" height="505" alt="image" src="https://github.com/user-attachments/assets/edf95a73-a8dd-4afa-90a3-001ed86c8410" />


- **Preview Support**
  - First-page thumbnail for quick identification

- **Tolerance Slider**
  - Adjustable threshold for image-heavy documents (default: 80%)

- **Client-Side Processing**
  - No uploads to server
  - Fully secure and local processing

- **Paginated Results**
  - Handles large batches efficiently

---

## ❓ What is "Accessibility" in this Tool?

A PDF is considered **accessible** if:
- It contains meaningful, selectable text
- Text is readable (not corrupted or garbled)
- Image content is below the configured threshold
- At least one page contains valid text content

---

## ⚠️ Accessibility Issues Detected

Instead of just saying *Accessible / Not Accessible*, this tool explains **why**:

| Issue | Meaning |
|------|--------|
| No readable text | Document is likely scanned |
| High image content | Too much of document is image-based |
| Very low text content | Insufficient readable content |
| Possible OCR issue | Text exists but quality is poor |

---

## 📜 Signed PDF Handling

- `.p7m` / `.pdf.p7m` files are supported
- Attempts extraction using ASN.1 decoding
- If extraction fails:
  - Marked as 🟡 *Unsupported signed document*

---

## 💡 How to Use

1. Open `index.html`
2. Click **Upload Documents**
3. Adjust tolerance if needed
4. Select files
5. Review results:

| Column | Description |
|-------|------------|
| Preview | First page |
| File Name | Uploaded file |
| Accessibility | Status (lamp indicator) |
| Issues Found | Detailed explanation |

---

## 🛠️ How It Works (Technical)

The tool analyzes each PDF by:
- Extracting text using **PDF.js**
- Measuring:
  - Text density
  - Image vs text ratio
  - Character quality
- Applying rule-based validation:
  - Text presence thresholds
  - Content quality heuristics

---

## 🔒 Privacy & Security

- 100% client-side processing
- No uploads or storage
- Suitable for sensitive documents (e.g., student records, immigration forms)

---

## ✨ Use Cases

- Sunapsis EForm validation
- OSU accessibility compliance checks
- Document intake quality control
- Batch auditing of PDFs before publishing

---

## ⚠️ Limitations

- Does not fully validate WCAG / PDF-UA standards
- Does not check:
  - Tags / structure tree
  - Heading hierarchy
  - Alt text for images
- OCR quality detection is heuristic-based

---

## 📦 Libraries

- **PDF.js** (Mozilla)
- **ASN1.js** (Lapo Luchini)

---

## 📣 Future Enhancements (Planned)

- Tag structure validation (PDF/UA)
- Heading detection
- Alt-text detection
- Accessibility scoring system
- Exportable audit reports

---

## 👨‍💻 Author / Customization

Customized version developed for:
- Accessibility auditing workflows
- Institutional document compliance
- Sunapsis EForm validation

---

## 📣 Feedback

Enhancements and feedback are welcome.
