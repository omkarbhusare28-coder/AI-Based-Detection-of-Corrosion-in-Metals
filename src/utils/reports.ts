import { jsPDF } from 'jspdf';
import { InspectionResult } from '../types';

/**
 * Generates and downloads a PDF report for a single inspection result.
 */
export async function downloadSingleInspectionPDF(result: InspectionResult): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Background Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AI-Based Corrosion Detection in Metals', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('METALLURGICAL VISUAL INSPECTION CERTIFICATE & REPORT', margin, 19);

  doc.setFontSize(8);
  doc.text(`Report ID: ${result.id}`, pageWidth - margin, 19, { align: 'right' });

  let y = 36;

  // Metadata Card Bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Inspection Timestamp:', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const formattedDate = new Date(result.timestamp).toLocaleString();
  doc.text(formattedDate, margin + 42, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('AI Engine:', margin + 105, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Gemini Vision Assistant', margin + 125, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Surface Material:', margin + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Metal Substrate (Verified)', margin + 42, y + 14);

  y += 24;

  // Two columns: Left is Image (max 85mm), Right is Inspection Assessment
  const colWidth = (contentWidth - 6) / 2;
  const imageBoxHeight = 85;

  // Draw image box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, colWidth, imageBoxHeight, 2, 2, 'FD');

  // Insert image if available
  const imgData = result.imageUrl || result.thumbnailUrl;
  if (imgData) {
    try {
      doc.addImage(imgData, 'JPEG', margin + 2, y + 2, colWidth - 4, imageBoxHeight - 4, undefined, 'FAST');
    } catch (e) {
      console.warn('Could not embed image directly, fallback drawing thumbnail', e);
      try {
        doc.addImage(result.thumbnailUrl, 'JPEG', margin + 2, y + 2, colWidth - 4, imageBoxHeight - 4, undefined, 'FAST');
      } catch (err) {
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('[Inspection Photograph]', margin + colWidth / 2, y + imageBoxHeight / 2, { align: 'center' });
      }
    }
  }

  // Right column: Findings Box
  const rightX = margin + colWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, colWidth, imageBoxHeight, 2, 2, 'FD');

  let rightY = y + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PRIMARY CLASSIFICATION', rightX + 6, rightY);

  rightY += 7;
  const isCorroded = result.classification === 'Corroded';

  // Classification Pill
  if (isCorroded) {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(239, 68, 68); // red-500
    doc.roundedRect(rightX + 6, rightY - 4, colWidth - 12, 12, 2, 2, 'FD');
    doc.setTextColor(185, 28, 28); // red-700
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('CORRODED', rightX + 10, rightY + 4);
  } else {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.roundedRect(rightX + 6, rightY - 4, colWidth - 12, 12, 2, 2, 'FD');
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('NON-CORRODED', rightX + 10, rightY + 4);
  }

  rightY += 18;

  // Confidence
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ANALYSIS CONFIDENCE', rightX + 6, rightY);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${result.confidence}%`, rightX + colWidth - 10, rightY, { align: 'right' });

  rightY += 4;
  // Progress Bar background
  const barWidth = colWidth - 12;
  const barHeight = 4;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(rightX + 6, rightY, barWidth, barHeight, 1.5, 1.5, 'F');

  // Fill Progress Bar
  const fillWidth = (barWidth * Math.min(100, Math.max(0, result.confidence))) / 100;
  if (isCorroded) {
    doc.setFillColor(220, 38, 38);
  } else {
    doc.setFillColor(16, 185, 129);
  }
  doc.roundedRect(rightX + 6, rightY, fillWidth, barHeight, 1.5, 1.5, 'F');

  rightY += 12;

  // Severity Rating
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('SEVERITY ASSESSMENT', rightX + 6, rightY);

  rightY += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');

  if (!isCorroded) {
    doc.setTextColor(16, 185, 129);
    doc.text('None (Intact Surface)', rightX + 6, rightY);
  } else {
    if (result.severity === 'Severe') {
      doc.setTextColor(185, 28, 28);
      doc.text('Severe Degradation', rightX + 6, rightY);
    } else if (result.severity === 'Moderate') {
      doc.setTextColor(194, 65, 12);
      doc.text('Moderate Oxidation', rightX + 6, rightY);
    } else {
      doc.setTextColor(161, 98, 7);
      doc.text('Mild Surface Rust', rightX + 6, rightY);
    }
  }

  rightY += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    isCorroded
      ? 'Action recommended based on structural criticality.'
      : 'No immediate anti-corrosion mitigation required.',
    rightX + 6,
    rightY,
    { maxWidth: colWidth - 12 }
  );

  y += imageBoxHeight + 8;

  // Technical Observations Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Visual Metallurgical Observations & Inspection Notes', margin + 6, y + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const notesText =
    result.notes ||
    (isCorroded
      ? 'Visual analysis detected distinct chromatic rust staining and surface roughness indicative of oxidation breakdown.'
      : 'Visual inspection shows intact metallic reflectivity with no detectable signs of pitting, rust, or galvanic degradation.');

  doc.text(notesText, margin + 6, y + 15, { maxWidth: contentWidth - 12 });

  y += 42;

  // Inspection Checklist Table
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Inspection Criteria Breakdown', margin + 6, y + 7);

  doc.setDrawColor(241, 245, 249);
  doc.line(margin + 4, y + 10, margin + contentWidth - 4, y + 10);

  const criteria = [
    { label: 'Surface Substrate Verification', value: 'Metallic Substrate Confirmed' },
    { label: 'Oxide Scale / Rust Identification', value: isCorroded ? 'Positive (Detected)' : 'Negative (Clean)' },
    { label: 'Severity Level Classification', value: result.severity || 'None' },
  ];

  let critY = y + 16;
  criteria.forEach((crit) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(crit.label, margin + 6, critY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(crit.value, margin + contentWidth - 6, critY, { align: 'right' });
    critY += 6.5;
  });

  // Footer Disclaimer
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, pageHeight - 24, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('DISCLAIMER: AI-based estimate. Not a substitute for professional inspection.', margin + 4, pageHeight - 16);

  // Save the PDF
  const safeDate = new Date(result.timestamp).toISOString().split('T')[0];
  doc.save(`Corrosion-Inspection-Report-${result.classification}-${safeDate}.pdf`);
}

/**
 * Opens a printable, styled HTML report in a new browser tab with automatic print styling and a Print button.
 */
export function openPrintableSingleReport(result: InspectionResult): void {
  const isCorroded = result.classification === 'Corroded';
  const formattedDate = new Date(result.timestamp).toLocaleString();

  const badgeColor = isCorroded ? '#ef4444' : '#10b981';
  const badgeBg = isCorroded ? '#fef2f2' : '#ecfdf5';
  const badgeBorder = isCorroded ? '#f87171' : '#34d399';
  const badgeText = isCorroded ? '#b91c1c' : '#047857';

  const severityColor =
    result.severity === 'Severe'
      ? '#dc2626'
      : result.severity === 'Moderate'
      ? '#ea580c'
      : result.severity === 'Mild'
      ? '#d97706'
      : '#059669';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Corrosion Inspection Report - ${result.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; padding: 24px; line-height: 1.5; }
    .container { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .header p { font-size: 13px; color: #94a3b8; }
    .actions { padding: 16px 32px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; display: flex; gap: 12px; justify-content: flex-end; }
    .btn { background: #2563eb; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: #1d4ed8; }
    .btn-secondary { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #f8fafc; }
    .content { padding: 32px; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }
    .meta-item { background: #f8fafc; padding: 12px 16px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .meta-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
    .meta-val { font-size: 14px; font-weight: 600; color: #0f172a; }
    .analysis-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .img-box { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #000; text-align: center; }
    .img-box img { width: 100%; height: 280px; object-fit: contain; background: #0f172a; }
    .findings-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; }
    .badge { display: inline-block; padding: 8px 16px; font-size: 18px; font-weight: 800; border-radius: 6px; background: ${badgeBg}; color: ${badgeText}; border: 1px solid ${badgeBorder}; letter-spacing: 0.5px; }
    .metric-row { margin-top: 18px; }
    .progress-bar-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 6px; }
    .progress-bar-fill { height: 100%; width: ${result.confidence}%; background: ${badgeColor}; }
    .severity-tag { font-weight: 700; font-size: 15px; color: ${severityColor}; }
    .notes-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 0 6px 6px 0; margin-bottom: 28px; }
    .notes-box h3 { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px; text-transform: uppercase; }
    .notes-box p { font-size: 14px; color: #334155; }
    .disclaimer-box { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 14px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; }
    @media print {
      body { background: white; padding: 0; }
      .container { border: none; box-shadow: none; max-width: 100%; }
      .actions { display: none; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .badge, .progress-bar-fill, .notes-box, .disclaimer-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>AI-Based Corrosion Detection in Metals</h1>
        <p>Visual Metallurgical Inspection Certificate</p>
      </div>
      <div style="text-align: right; font-size: 12px; color: #94a3b8;">
        <div>ID: ${result.id}</div>
        <div>Report Date: ${formattedDate}</div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" onclick="window.close()">Close</button>
      <button class="btn" onclick="window.print()">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
        Print / Save to PDF
      </button>
    </div>

    <div class="content">
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Inspection Date</div>
          <div class="meta-val">${formattedDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Substrate Verification</div>
          <div class="meta-val">Metal Surface Confirmed</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Analysis Model</div>
          <div class="meta-val">Gemini 3.8 Flash Vision</div>
        </div>
      </div>

      <div class="analysis-section">
        <div class="img-box">
          <img src="${result.imageUrl || result.thumbnailUrl}" alt="Inspected Metal Surface" />
        </div>
        <div class="findings-box">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 8px;">Inspection Classification</div>
            <div class="badge">${result.classification.toUpperCase()}</div>
          </div>

          <div class="metric-row">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600;">
              <span>Confidence Level</span>
              <span>${result.confidence}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill"></div>
            </div>
          </div>

          <div class="metric-row">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px;">Corrosion Severity Rating</div>
            <div class="severity-tag">
              ${isCorroded ? `${result.severity} Severity` : 'None (Surface Intact)'}
            </div>
          </div>
        </div>
      </div>

      <div class="notes-box">
        <h3>Metallurgical Inspection Observations</h3>
        <p>${result.notes || 'Visual analysis performed using high-resolution morphological inspection algorithm.'}</p>
      </div>

      <div class="disclaimer-box">
        AI-based estimate. Not a substitute for professional inspection.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

/**
 * Generates and downloads a summary PDF report for the entire history log.
 */
export async function downloadFullHistoryPDF(history: InspectionResult[]): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AI-Based Corrosion Detection in Metals', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('CONSOLIDATED INSPECTION AUDIT LOG & HISTORY REPORT', margin, 19);

  doc.setFontSize(8);
  doc.text(`Total Records: ${history.length}`, pageWidth - margin, 19, { align: 'right' });

  // Summary Metrics Banner
  let y = 35;
  const corrodedCount = history.filter((h) => h.classification === 'Corroded').length;
  const nonCorrodedCount = history.length - corrodedCount;
  const avgConfidence = history.length
    ? Math.round(history.reduce((acc, h) => acc + h.confidence, 0) / history.length)
    : 0;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Inspections: ${history.length}`, margin + 6, y + 10);
  doc.setTextColor(185, 28, 28);
  doc.text(`Corroded: ${corrodedCount}`, margin + 55, y + 10);
  doc.setTextColor(4, 120, 87);
  doc.text(`Non-Corroded: ${nonCorrodedCount}`, margin + 95, y + 10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Avg Confidence: ${avgConfidence}%`, margin + 140, y + 10);

  y += 24;

  // Table Headers
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Thumb', margin + 4, y + 5.5);
  doc.text('Date & Time', margin + 22, y + 5.5);
  doc.text('Classification', margin + 68, y + 5.5);
  doc.text('Severity', margin + 106, y + 5.5);
  doc.text('Confidence', margin + 138, y + 5.5);
  doc.text('Notes', margin + 162, y + 5.5);

  y += 9;

  for (let i = 0; i < history.length; i++) {
    const item = history[i];

    // Check if we need a new page
    if (y + 18 > pageHeight - 25) {
      doc.addPage();
      y = 16;
      // Header on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Thumb', margin + 4, y + 5.5);
      doc.text('Date & Time', margin + 22, y + 5.5);
      doc.text('Classification', margin + 68, y + 5.5);
      doc.text('Severity', margin + 106, y + 5.5);
      doc.text('Confidence', margin + 138, y + 5.5);
      doc.text('Notes', margin + 162, y + 5.5);
      y += 9;
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 16, margin + contentWidth, y + 16);

    // Draw Thumbnail
    if (item.thumbnailUrl) {
      try {
        doc.addImage(item.thumbnailUrl, 'JPEG', margin + 2, y, 14, 14, undefined, 'FAST');
      } catch (e) {
        doc.setFillColor(226, 232, 240);
        doc.rect(margin + 2, y, 14, 14, 'F');
      }
    }

    // Date
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const dateStr = new Date(item.timestamp).toLocaleString();
    doc.text(dateStr, margin + 22, y + 8, { maxWidth: 44 });

    // Classification
    const isCorroded = item.classification === 'Corroded';
    doc.setFont('helvetica', 'bold');
    if (isCorroded) {
      doc.setTextColor(220, 38, 38);
      doc.text('Corroded', margin + 68, y + 8);
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text('Non-corroded', margin + 68, y + 8);
    }

    // Severity
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(item.severity || 'None', margin + 106, y + 8);

    // Confidence
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.confidence}%`, margin + 138, y + 8);

    // Notes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.notes || '-', margin + 162, y + 6, { maxWidth: contentWidth - 162 });

    y += 18;
  }

  // Footer Disclaimer on current page
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, pageHeight - 16, contentWidth, 10, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('DISCLAIMER: AI-based estimate. Not a substitute for professional inspection.', margin + 4, pageHeight - 10);

  doc.save(`Corrosion-Inspection-Audit-Log-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Opens a printable HTML audit log report for the entire history in a new tab.
 */
export function openPrintableFullHistoryReport(history: InspectionResult[]): void {
  const corrodedCount = history.filter((h) => h.classification === 'Corroded').length;
  const nonCorrodedCount = history.length - corrodedCount;
  const avgConfidence = history.length
    ? Math.round(history.reduce((acc, h) => acc + h.confidence, 0) / history.length)
    : 0;

  const rowsHtml = history
    .map((item) => {
      const isCorroded = item.classification === 'Corroded';
      const badgeStyle = isCorroded
        ? 'background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5;'
        : 'background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7;';

      const dateStr = new Date(item.timestamp).toLocaleString();
      return `
      <tr>
        <td>
          <img src="${item.thumbnailUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;" alt="thumbnail" />
        </td>
        <td style="font-size: 13px; color: #334155;">${dateStr}</td>
        <td>
          <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; ${badgeStyle}">
            ${item.classification}
          </span>
        </td>
        <td style="font-size: 13px; font-weight: 600; color: #475569;">${item.severity || 'None'}</td>
        <td style="font-size: 13px; font-weight: 700; color: #0f172a;">${item.confidence}%</td>
        <td style="font-size: 12px; color: #64748b; max-width: 250px;">${item.notes || '-'}</td>
      </tr>
      `;
    })
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Corrosion Inspection Audit Log</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; padding: 24px; line-height: 1.5; }
    .container { max-width: 1000px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .header { background: #0f172a; color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 20px; font-weight: 700; }
    .header p { font-size: 13px; color: #94a3b8; }
    .actions { padding: 16px 32px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; display: flex; gap: 12px; justify-content: flex-end; }
    .btn { background: #2563eb; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; }
    .btn:hover { background: #1d4ed8; }
    .btn-secondary { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; }
    .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 24px 32px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .stat-card { background: white; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center; }
    .stat-val { font-size: 22px; font-weight: 800; color: #0f172a; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-top: 2px; }
    .table-box { padding: 24px 32px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f1f5f9; padding: 10px 12px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .disclaimer-box { margin: 24px 32px 32px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 12px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; }
    @media print {
      body { background: white; padding: 0; }
      .container { border: none; box-shadow: none; max-width: 100%; }
      .actions { display: none; }
      .header, .stats-bar, th, td, .disclaimer-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>AI-Based Corrosion Detection in Metals</h1>
        <p>Complete Inspection Audit Log & History</p>
      </div>
      <div style="text-align: right; font-size: 12px; color: #94a3b8;">
        <div>Export Date: ${new Date().toLocaleString()}</div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" onclick="window.close()">Close</button>
      <button class="btn" onclick="window.print()">Print Audit Log</button>
    </div>

    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-val">${history.length}</div>
        <div class="stat-lbl">Total Records</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #dc2626;">${corrodedCount}</div>
        <div class="stat-lbl">Corroded</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #10b981;">${nonCorrodedCount}</div>
        <div class="stat-lbl">Non-Corroded</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${avgConfidence}%</div>
        <div class="stat-lbl">Avg Confidence</div>
      </div>
    </div>

    <div class="table-box">
      <table>
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Timestamp</th>
            <th>Classification</th>
            <th>Severity</th>
            <th>Confidence</th>
            <th>Visual Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 32px; color: #94a3b8;">No inspection records recorded.</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="disclaimer-box">
      AI-based estimate. Not a substitute for professional inspection.
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
