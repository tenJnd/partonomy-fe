// src/utils/exportJsonToPdf.ts
import jsPDF from 'jspdf';
import { sanitizeFilename } from './filename';

type AnyReport = any;

// Will be set inside exportJsonToPdf where we have doc
let CONTENT_WIDTH = 180;
const MARGIN_LEFT = 14;
const TOP_START = 20;

// --- Helpers ---

const ensurePage = (doc: jsPDF, y: number) => {
  if (y > 270) {
    doc.addPage();
    return TOP_START;
  }
  return y;
};

const addSectionTitle = (doc: jsPDF, text: string, y: number) => {
  y = ensurePage(doc, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(text, MARGIN_LEFT, y);
  return y + 8;
};

const addLabelValueInline = (
  doc: jsPDF,
  label: string,
  value: string,
  y: number
) => {
  if (!value) return y;
  y = ensurePage(doc, y + 2);

  doc.setFontSize(10);

  // label
  doc.setFont('helvetica', 'bold');
  const labelText = `${label}: `;
  const labelWidth = doc.getTextWidth(labelText);

  // value wrapped to remaining width
  const remainingWidth = CONTENT_WIDTH - labelWidth;
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(value, remainingWidth);

  // first line goes next to the label, others start at label indent
  doc.setFont('helvetica', 'bold');
  doc.text(labelText, MARGIN_LEFT, y);

  doc.setFont('helvetica', 'normal');
  doc.text(lines, MARGIN_LEFT + labelWidth, y);

  return y + lines.length * 5;
};

// For long text (summary, fit summary, paragraphs)
const addBlock = (
  doc: jsPDF,
  label: string,
  value: string,
  y: number
) => {
  if (!value) return y;
  y = ensurePage(doc, y + 2);

  doc.setFontSize(10);

  // label on its own line
  doc.setFont('helvetica', 'bold');
  doc.text(label, MARGIN_LEFT, y);
  y += 5;

  // paragraph under it, full width
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(value, CONTENT_WIDTH);
  doc.text(lines, MARGIN_LEFT, y);

  return y + lines.length * 5;
};

const addMultilineList = (doc: jsPDF, items: string[], y: number) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  items.forEach((item) => {
    if (!item) return;
    y = ensurePage(doc, y + 2);
    const bullet = '• ';
    const lines = doc.splitTextToSize(bullet + item, CONTENT_WIDTH);
    doc.text(lines, MARGIN_LEFT, y);
    y += lines.length * 5;
  });

  return y;
};

export const exportJsonToPdf = (data: AnyReport, fileName = 'analysis_report') => {
  const doc = new jsPDF();

  // calculate content width from actual page size
  const pageWidth = doc.internal.pageSize.getWidth();
  CONTENT_WIDTH = pageWidth - MARGIN_LEFT * 2;

  const overview = data.overview ?? {};
  const assessment = data.assessment ?? {};
  const drawingInfo = data.drawing_info ?? {};
  const shopAlignment = assessment.shop_alignment ?? {};
  const processHints = data.process_hints ?? {};

  const risks: string[] = Array.isArray(assessment.key_risks)
    ? assessment.key_risks
    : [];
  const opps: string[] = Array.isArray(assessment.key_opportunities)
    ? assessment.key_opportunities
    : [];

  const routing: string[] = Array.isArray(processHints.likely_routing_steps)
    ? processHints.likely_routing_steps
    : [];
  const machine: string[] = Array.isArray(processHints.machine_capability_hint)
    ? processHints.machine_capability_hint
    : [];
  const inspection: string[] = Array.isArray(processHints.inspection_focus)
    ? processHints.inspection_focus
    : [];

  // --- TITLE / HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Part Manufacturability Report', MARGIN_LEFT, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = 26;

  y = addLabelValueInline(doc, 'Drawing title', drawingInfo.drawing_title || '', y);
  y = addLabelValueInline(doc, 'Drawing number', drawingInfo.drawing_number || '', y);
  y = addLabelValueInline(doc, 'Part type', overview.part_type || '', y);
  y = addLabelValueInline(doc, 'Company', drawingInfo.company_name || '', y);
  y = addLabelValueInline(doc, 'Base unit', drawingInfo.base_unit || '', y);
  y = addLabelValueInline(
    doc,
    'Overall complexity',
    assessment.overall_complexity || '',
    y
  );
  y = addLabelValueInline(
    doc,
    'Manufacturing risk level',
    assessment.manufacturing_risk_level || '',
    y
  );
  y = addLabelValueInline(doc, 'Fit level', shopAlignment.fit_level || '', y);

  y += 4;
  y = ensurePage(doc, y);

  // --- SUMMARY ---
  y = addSectionTitle(doc, 'Summary', y);

  // Quick summary and fit summary as full-width blocks (no chop on the right)
  y = addBlock(doc, 'Quick summary', overview.quick_summary || '', y);
  y = addBlock(doc, 'Fit summary', shopAlignment.fit_summary || '', y);

  if (Array.isArray(overview.highlight_summary) && overview.highlight_summary.length > 0) {
    y = ensurePage(doc, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Highlights:', MARGIN_LEFT, y);
    y += 5;
    y = addMultilineList(doc, overview.highlight_summary, y);
  }

  // --- SHOP ALIGNMENT (short inline bits; summary we already printed above) ---
  if (shopAlignment.fit_level) {
    y = ensurePage(doc, y + 6);
    y = addSectionTitle(doc, 'Shop Alignment', y);
    y = addLabelValueInline(doc, 'Fit level', shopAlignment.fit_level || '', y);
  }

  // --- RISKS & OPPORTUNITIES ---
  if (risks.length || opps.length) {
    y = ensurePage(doc, y + 6);
    y = addSectionTitle(doc, 'Key Risks & Opportunities', y);

    if (risks.length) {
      y = ensurePage(doc, y + 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Risks:', MARGIN_LEFT, y);
      y += 5;
      y = addMultilineList(doc, risks, y);
    }

    if (opps.length) {
      y = ensurePage(doc, y + 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Opportunities:', MARGIN_LEFT, y);
      y += 5;
      y = addMultilineList(doc, opps, y);
    }
  }

  // --- COST DRIVERS ---
  if (Array.isArray(data.cost_drivers) && data.cost_drivers.length > 0) {
    y = ensurePage(doc, y + 6);
    y = addSectionTitle(doc, 'Cost Drivers', y);

    data.cost_drivers.forEach((cd: any, idx: number) => {
      y = ensurePage(doc, y + 4);
      const header = `${idx + 1}. ${cd.factor || 'Cost driver'}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(header, MARGIN_LEFT, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const impactLine = `Impact: ${cd.impact || '-'}`;
      doc.text(impactLine, MARGIN_LEFT + 2, y);
      y += 4;

      if (cd.details) {
        const lines = doc.splitTextToSize(cd.details, CONTENT_WIDTH - 2);
        doc.text(lines, MARGIN_LEFT + 2, y);
        y += lines.length * 4;
      }
    });
  }

  // --- CRITICAL POINTS ---
  if (Array.isArray(data.critical_points) && data.critical_points.length > 0) {
    y = ensurePage(doc, y + 6);
    y = addSectionTitle(doc, 'Critical Points', y);

    data.critical_points.forEach((cp: any, idx: number) => {
      y = ensurePage(doc, y + 4);
      const header = `${idx + 1}. ${cp.type || 'Feature'}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(header, MARGIN_LEFT, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const importanceLine = `Importance: ${cp.importance || '-'}`;
      doc.text(importanceLine, MARGIN_LEFT + 2, y);
      y += 4;

      if (cp.description) {
        const lines = doc.splitTextToSize(cp.description, CONTENT_WIDTH - 2);
        doc.text(lines, MARGIN_LEFT + 2, y);
        y += lines.length * 4;
      }
    });
  }

  // --- PROCESS HINTS ---
  if (routing.length || machine.length || inspection.length) {
    y = ensurePage(doc, y + 6);
    y = addSectionTitle(doc, 'Process Hints', y);

    if (routing.length) {
      y = ensurePage(doc, y + 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Routing steps:', MARGIN_LEFT, y);
      y += 5;
      y = addMultilineList(doc, routing, y);
    }

    if (machine.length) {
      y = ensurePage(doc, y + 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Machine capability:', MARGIN_LEFT, y);
      y += 5;
      y = addMultilineList(doc, machine, y);
    }

    if (inspection.length) {
      y = ensurePage(doc, y + 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Inspection focus:', MARGIN_LEFT, y);
      y += 5;
      y = addMultilineList(doc, inspection, y);
    }
  }

  // --- INTERNAL NOTES ---
  if (Array.isArray(data.internal_notes) && data.internal_notes.length > 0) {
    y = ensurePage(doc, y + 6);
    y = addSectionTitle(doc, 'Internal Notes', y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    data.internal_notes.forEach((note: string, idx: number) => {
      y = ensurePage(doc, y + 4);
      const prefix = `${idx + 1}. `;
      const lines = doc.splitTextToSize(prefix + note, CONTENT_WIDTH);
      doc.text(lines, MARGIN_LEFT, y);
      y += lines.length * 4;
    });
  }

  doc.save(`${sanitizeFilename(fileName)}_report.pdf`);

};
