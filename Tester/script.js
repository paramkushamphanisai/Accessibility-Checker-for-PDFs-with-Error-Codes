// PDF.js worker configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const progressTitle = document.getElementById('progressTitle');
const progressBar = document.getElementById('progressBar');
const resultsSection = document.getElementById('resultsSection');
const uploadAgainBtn = document.getElementById('uploadAgainBtn');
const resultsTableContainer = document.getElementById('resultsTableContainer');
const legend = document.getElementById('legend');

// Tolerance slider
const toleranceSection = document.getElementById('toleranceSection');
const toleranceSlider = document.getElementById('toleranceSlider');
const toleranceValue = document.getElementById('toleranceValue');
let tolerancePercent = parseInt(toleranceSlider.value) || 80;

// Update slider value display
toleranceSlider.oninput = function() {
    toleranceValue.textContent = this.value + "%";
    tolerancePercent = parseInt(this.value);
};
toleranceValue.textContent = toleranceSlider.value + "%";

let allResults = [];
let currentPage = 1;
const pageSize = 20;

// UI helpers
function showUploadBtn() {
    uploadBtn.style.display = 'inline-block';
    fileInput.value = '';
    progressContainer.style.display = 'none';
    resultsSection.style.display = 'none';
    resultsTableContainer.innerHTML = '';
    legend.style.display = 'none';
    toleranceSection.style.display = 'flex';
}
function showProgress(title, percent, color = '#4f8cff') {
    progressContainer.style.display = 'block';
    progressTitle.textContent = title;
    progressBar.style.width = percent + '%';
    progressBar.style.background = color;
}
function hideProgress() {
    progressContainer.style.display = 'none';
}
function showResults(results) {
    allResults = results;
    currentPage = 1;
    resultsSection.style.display = 'block';
    legend.style.display = 'flex';
    renderResultsTable();
}
function renderResultsTable() {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, allResults.length);
    let tableHtml = `<table class="results-table">
        <tr>
            <th>Preview</th>
            <th>File Name</th>
            <th>Accessibility</th>
        </tr>`;
    for(let i = startIdx; i < endIdx; i++) {
        const res = allResults[i];
        let preview = res.previewDataUrl
            ? `<img src="${res.previewDataUrl}" class="pdf-preview" alt="PDF Preview">`
            : `<img src="pdf_placeholder.svg" class="pdf-preview" alt="PDF Preview">`;
        let lamp;
        if (res.signedUnsupported) {
            lamp = `<img src="lamp_yellow.svg" class="lamp-icon" alt="Signed PDF not supported">`;
        } else {
            lamp = res.accessible
                ? `<img src="lamp_green.svg" class="lamp-icon" alt="Accessible">`
                : `<img src="lamp_red.svg" class="lamp-icon" alt="Not accessible">`;
        }
        tableHtml += `<tr>
            <td>${preview}</td>
            <td>${res.filename}</td>
            <td>${lamp}</td>
        </tr>`;
    }
    tableHtml += `</table>`;

    // Pagination
    if (allResults.length > pageSize) {
        let pages = Math.ceil(allResults.length / pageSize);
        tableHtml += `<div class="pagination">
            <button class="pagination-btn" id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${currentPage} of ${pages}</span>
            <button class="pagination-btn" id="nextPageBtn" ${currentPage === pages ? 'disabled' : ''}>Next</button>
        </div>`;
    }
    resultsTableContainer.innerHTML = tableHtml;
    if (allResults.length > pageSize) {
        document.getElementById('prevPageBtn').onclick = () => { if(currentPage > 1){currentPage--; renderResultsTable();} };
        document.getElementById('nextPageBtn').onclick = () => { let pages = Math.ceil(allResults.length / pageSize); if(currentPage < pages){currentPage++; renderResultsTable();} };
    }
}

// Extract PDF from .p7m (using Lapo Luchini's asn1.js)
async function extractPdfFromP7m(arrayBuffer) {
    try {
        // ASN.1 decode
        const asn1 = ASN1.decode(arrayBuffer);
        // Search for the PDF in ASN.1 content
        function findPdf(node) {
            if (node.sub) {
                for (const sub of node.sub) {
                    const found = findPdf(sub);
                    if (found) return found;
                }
            }
            if (node.stream && node.stream.length > 4 &&
                node.stream[0] === 0x25 && node.stream[1] === 0x50 &&
                node.stream[2] === 0x44 && node.stream[3] === 0x46) {
                // Found "%PDF"
                return new Uint8Array(node.stream);
            }
            return null;
        }
        return findPdf(asn1);
    } catch (e) {
        return null;
    }
}

// PDF analysis
async function analyzePDF(file, idx, total) {
    let filename = file.name;
    // If .p7m or .pdf.p7m, try to extract PDF
    if (filename.toLowerCase().endsWith('.p7m') || filename.toLowerCase().endsWith('.pdf.p7m')) {
        const arrayBuffer = await file.arrayBuffer();
        let pdfData = await extractPdfFromP7m(arrayBuffer);
        if (!pdfData) {
            // Could not extract PDF, yellow lamp
            return { filename, accessible: false, previewDataUrl: "", signedUnsupported: true };
        }
        file = new Blob([pdfData], { type: "application/pdf" });
    }
    // Normal PDF analysis
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    let doc;
    try {
        doc = await loadingTask.promise;
    } catch (e) {
        return { filename, accessible: false, previewDataUrl: "", error: true };
    }
    // First page preview
    let previewDataUrl = "";
    try {
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        previewDataUrl = canvas.toDataURL("image/png");
    } catch (e) {
        previewDataUrl = "";
    }
    // Accessibility analysis with image tolerance
    let totalImagePages = 0;
    let totalPages = doc.numPages;
    let totalTextChars = 0;
    let totalEstimatedTextChars = 0;
    let realTextPages = 0;
    for (let i = 1; i <= totalPages; i++) {
        try {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            const items = textContent.items;
            if (items.length > 0) {
                let text = items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
                let chars = text.length;
                totalTextChars += chars;
                totalEstimatedTextChars += 2000;
                if (chars > 20) {
                    let normalChars = text.replace(/[^a-zA-Z0-9À-ÿ\s.,;:'"-]/g, "");
                    let ratio = normalChars.length / chars;
                    if (ratio > 0.7) {
                        realTextPages += 1;
                    }
                }
            } else {
                totalEstimatedTextChars += 2000;
                totalImagePages += 1;
            }
        } catch (e) {
            totalImagePages += 1;
            totalEstimatedTextChars += 2000;
        }
    }
    let textPercent = (totalTextChars / totalEstimatedTextChars) * 100;
    let imagePercent = 100 - textPercent;
    let accessible = imagePercent < tolerancePercent && realTextPages > 0;
    return { filename, accessible, previewDataUrl };
}

// File filter: accept .pdf, .p7m, .pdf.p7m, exclude .lnk
function filterFiles(files) {
    return Array.from(files).filter(f =>
        (f.type === "application/pdf" ||
         f.name.toLowerCase().endsWith('.p7m') ||
         f.name.toLowerCase().endsWith('.pdf.p7m')) &&
        !f.name.toLowerCase().endsWith('.lnk')
    );
}

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = async function() {
    const files = filterFiles(fileInput.files);
    if (files.length === 0) {
        alert('Only real PDF files and signed PDF files (.p7m, .pdf.p7m) are accepted!');
        showUploadBtn();
        return;
    }
    uploadBtn.style.display = 'none';
    toleranceSection.style.display = 'none';
    showProgress('Uploading files...', 0, '#4f8cff');
    let results = [];
    for (let i = 0; i < files.length; i++) {
        showProgress(`Analyzing documents... (${i+1}/${files.length})`, Math.round(((i)/files.length)*100), '#34d49c');
        let res = await analyzePDF(files[i], i+1, files.length);
        results.push(res);
        showProgress(`Analyzing documents... (${i+1}/${files.length})`, Math.round(((i+1)/files.length)*100), '#34d49c');
    }
    hideProgress();
    showResults(results);
};

uploadAgainBtn.onclick = showUploadBtn;

showUploadBtn();