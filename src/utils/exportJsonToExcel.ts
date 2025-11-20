// src/utils/exportJsonToExcel.ts
import * as XLSX from 'xlsx';
import { sanitizeFilename } from './filename';


export const exportJsonToExcel = (data: any, fileName = 'analysis_export') => {
  const workbook = XLSX.utils.book_new();

  const overview = data.overview ?? {};
  const assessment = data.assessment ?? {};
  const drawingInfo = data.drawing_info ?? {};
  const shopAlignment = assessment.shop_alignment ?? {};
  const processHints = data.process_hints ?? {};

  // Helper: join array of strings
  const joinArray = (arr: any) =>
    Array.isArray(arr) ? arr.join(' | ') : '';

  // --- 1) SUMMARY (1 řádek, všechno důležité pohromadě) ---
  const summaryRow = {
    part_type: overview.part_type ?? '',
    material: overview.material?.value ?? '',
    primary_class: overview.taxonomy?.primary_class ?? '',
    process_family: overview.taxonomy?.process_family ?? '',
    application_hint: overview.taxonomy?.application_hint ?? '',
    drawing_complexity: overview.drawing_complexity ?? '',
    overall_complexity: assessment.overall_complexity ?? '',
    manufacturing_risk_level: assessment.manufacturing_risk_level ?? '',
    fit_level: shopAlignment.fit_level ?? '',
    fit_summary: shopAlignment.fit_summary ?? '',
    summary: overview.quick_summary ?? '',
    highlights: joinArray(overview.highlight_summary),
    drawing_number: drawingInfo.drawing_number ?? '',
    drawing_title: drawingInfo.drawing_title ?? '',
    company: drawingInfo.company_name ?? '',
    base_unit: drawingInfo.base_unit ?? '',
    overall_confidence: data.overall_confidence ?? '',
  };

  const summarySheet = XLSX.utils.json_to_sheet([summaryRow]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // --- 2) OVERVIEW (key–value přehled, podobně jako v UI) ---
  const overviewSheetData = [
    { section: 'Part type', value: overview.part_type ?? '' },
    { section: 'Part type (drawing desc)', value: drawingInfo.part_type_desc ?? '' },

    { section: 'Material', value: overview.material?.value ?? '' },
    { section: 'Material note', value: overview.material?.text ?? '' },
    {
      section: 'Material confidence (%)',
      value:
        overview.material?.confidence != null
          ? (overview.material.confidence * 100).toFixed(0)
          : '',
    },

    { section: 'Blank dimensions (norm)', value: overview.blank_dimensions?.text_norm ?? '' },
    { section: 'Blank dimensions (raw)', value: overview.blank_dimensions?.text ?? '' },
    { section: 'Blank unit', value: overview.blank_dimensions?.unit ?? '' },
    { section: 'Blank source', value: overview.blank_dimensions?.source ?? '' },
    {
      section: 'Blank confidence (%)',
      value:
        overview.blank_dimensions?.confidence != null
          ? (overview.blank_dimensions.confidence * 100).toFixed(0)
          : '',
    },

    { section: 'Primary class', value: overview.taxonomy?.primary_class ?? '' },
    { section: 'Secondary class', value: overview.taxonomy?.secondary_class ?? '' },
    { section: 'Process family', value: overview.taxonomy?.process_family ?? '' },
    { section: 'Application hint', value: overview.taxonomy?.application_hint ?? '' },

    { section: 'Drawing complexity', value: overview.drawing_complexity ?? '' },
    { section: 'Overall complexity', value: assessment.overall_complexity ?? '' },
    { section: 'Manufacturing risk level', value: assessment.manufacturing_risk_level ?? '' },

    { section: 'Fit level', value: shopAlignment.fit_level ?? '' },
    { section: 'Fit summary', value: shopAlignment.fit_summary ?? '' },

    { section: 'Quick summary', value: overview.quick_summary ?? '' },
    { section: 'Highlights', value: joinArray(overview.highlight_summary) },

    { section: 'Drawing number', value: drawingInfo.drawing_number ?? '' },
    { section: 'Drawing title', value: drawingInfo.drawing_title ?? '' },
    { section: 'Part number', value: drawingInfo.part_number ?? '' },
    { section: 'Revision', value: drawingInfo.revision ?? '' },
    { section: 'Drawing date', value: drawingInfo.date ?? '' },
    { section: 'Revision date', value: drawingInfo.revision_date ?? '' },
    { section: 'Scale', value: drawingInfo.scale ?? '' },
    { section: 'Base unit', value: drawingInfo.base_unit ?? '' },
    { section: 'Author', value: drawingInfo.author ?? '' },
    { section: 'Checker', value: drawingInfo.checker ?? '' },
    { section: 'Approver', value: drawingInfo.approver ?? '' },
    {
      section: 'Sheet',
      value:
        drawingInfo.sheet_info
          ? `${drawingInfo.sheet_info.sheet} / ${drawingInfo.sheet_info.total_sheets}`
          : '',
    },
    { section: 'Projection type', value: drawingInfo.projection_type ?? '' },
    { section: 'Company', value: drawingInfo.company_name ?? '' },
    { section: 'Project', value: drawingInfo.project_name ?? '' },

    { section: 'Overall confidence', value: data.overall_confidence ?? '' },
  ];

  const overviewSheet = XLSX.utils.json_to_sheet(overviewSheetData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // --- 3) Risks & Opportunities ---
  const risks: string[] = Array.isArray(assessment.key_risks)
    ? assessment.key_risks
    : [];
  const opportunities: string[] = Array.isArray(assessment.key_opportunities)
    ? assessment.key_opportunities
    : [];

  if (risks.length || opportunities.length) {
    const riskOppSheetData = [
      ...risks.map((r, idx) => ({
        '#': idx + 1,
        type: 'Risk',
        text: r,
      })),
      ...opportunities.map((o, idx) => ({
        '#': risks.length + idx + 1,
        type: 'Opportunity',
        text: o,
      })),
    ];

    const riskOppSheet = XLSX.utils.json_to_sheet(riskOppSheetData);
    XLSX.utils.book_append_sheet(workbook, riskOppSheet, 'Risks & Opps');
  }

  // --- 4) Cost drivers ---
  if (Array.isArray(data.cost_drivers)) {
    const costDriversSheetData = data.cost_drivers.map((cd: any, index: number) => ({
      '#': index + 1,
      factor: cd.factor,
      impact: cd.impact,
      details: cd.details,
    }));
    const sheet = XLSX.utils.json_to_sheet(costDriversSheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Cost Drivers');
  }

  // --- 5) Critical points ---
  if (Array.isArray(data.critical_points)) {
    const criticalPointsSheetData = data.critical_points.map((cp: any, index: number) => ({
      '#': index + 1,
      type: cp.type,
      importance: cp.importance,
      description: cp.description,
    }));
    const sheet = XLSX.utils.json_to_sheet(criticalPointsSheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Critical Points');
  }

  // --- 6) Process Hints (routing, machine, inspection) ---
  const routing: string[] = Array.isArray(processHints.likely_routing_steps)
    ? processHints.likely_routing_steps
    : [];
  const machine: string[] = Array.isArray(processHints.machine_capability_hint)
    ? processHints.machine_capability_hint
    : [];
  const inspection: string[] = Array.isArray(processHints.inspection_focus)
    ? processHints.inspection_focus
    : [];

  if (routing.length || machine.length || inspection.length) {
    const processSheetData = [
      ...routing.map((step, idx) => ({
        '#': idx + 1,
        category: 'Routing step',
        text: step,
      })),
      ...machine.map((m, idx) => ({
        '#': routing.length + idx + 1,
        category: 'Machine capability',
        text: m,
      })),
      ...inspection.map((i, idx) => ({
        '#': routing.length + machine.length + idx + 1,
        category: 'Inspection focus',
        text: i,
      })),
    ];

    const processSheet = XLSX.utils.json_to_sheet(processSheetData);
    XLSX.utils.book_append_sheet(workbook, processSheet, 'Process Hints');
  }

  // --- 7) Internal notes ---
  if (Array.isArray(data.internal_notes)) {
    const notesSheetData = data.internal_notes.map((note: string, index: number) => ({
      '#': index + 1,
      note,
    }));
    const sheet = XLSX.utils.json_to_sheet(notesSheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Internal Notes');
  }

  // --- 8) BOM (bonus, není přímo v UI teď, ale může se hodit) ---
  if (Array.isArray(data.bill_of_materials)) {
    const bomSheetData = data.bill_of_materials.map((item: any, index: number) => ({
      '#': index + 1,
      part_number: item.part_number,
      quantity: item.quantity,
      material: item.material,
      weight: item.weight,
      unit: item.unit,
      weight_unit: item.weight_unit,
    }));
    const sheet = XLSX.utils.json_to_sheet(bomSheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'BOM');
  }

  // --- 9) Revision history (bonus) ---
  if (Array.isArray(data.revision_history)) {
    const revSheetData = data.revision_history.map((rev: any, index: number) => ({
      '#': index + 1,
      date: rev.date,
      author: rev.author,
      rev_number: rev.rev_number,
      description: rev.description,
    }));
    const sheet = XLSX.utils.json_to_sheet(revSheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Revision History');
  }

  XLSX.writeFile(workbook, `${sanitizeFilename(fileName)}_report.xlsx`);
};
