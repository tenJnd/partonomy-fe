// src/utils/exportJsonToText.ts
import { sanitizeFilename } from './filename';

type AnyReport = any;

const splitIntoSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

const buildTextReport = (data: AnyReport): string => {
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
  const costDrivers = Array.isArray(data.cost_drivers) ? data.cost_drivers : [];
  const criticalPoints = Array.isArray(data.critical_points)
    ? data.critical_points
    : [];
  const internalNotes = Array.isArray(data.internal_notes)
    ? data.internal_notes
    : [];

  const lines: string[] = [];

  // Header
  lines.push('Part Manufacturability Report');
  lines.push('=============================');
  lines.push('');

  if (drawingInfo.drawing_title) {
    lines.push(`File: ${drawingInfo.drawing_title}`);
  }
  if (overview.part_type) {
    lines.push(`Part: ${overview.part_type}`);
  }
  if (drawingInfo.company_name) {
    lines.push(`Company: ${drawingInfo.company_name}`);
  }
  if (drawingInfo.drawing_number) {
    lines.push(`Drawing number: ${drawingInfo.drawing_number}`);
  }
  if (drawingInfo.base_unit) {
    lines.push(`Base unit: ${drawingInfo.base_unit}`);
  }
  lines.push('');

  // Summary
  if (overview.quick_summary || overview.highlight_summary) {
    lines.push('Summary');
    lines.push('-------');

    if (overview.quick_summary) {
      lines.push('');
      lines.push('Quick summary:');
      const sentences = splitIntoSentences(overview.quick_summary);
      if (sentences.length) {
        sentences.forEach((s) => lines.push(s));
      } else {
        lines.push(overview.quick_summary);
      }
    }

    if (Array.isArray(overview.highlight_summary) && overview.highlight_summary.length) {
      lines.push('');
      lines.push('Highlights:');
      overview.highlight_summary.forEach((h: string) => {
        lines.push(`- ${h}`);
      });
    }

    lines.push('');
  }

  // Key metrics
  if (
    assessment.overall_complexity ||
    assessment.manufacturing_risk_level ||
    shopAlignment.fit_level ||
    shopAlignment.fit_summary
  ) {
    lines.push('Key metrics');
    lines.push('-----------');
    if (assessment.overall_complexity) {
      lines.push(`- Overall complexity: ${assessment.overall_complexity}`);
    }
    if (assessment.manufacturing_risk_level) {
      lines.push(`- Manufacturing risk level: ${assessment.manufacturing_risk_level}`);
    }
    if (shopAlignment.fit_level) {
      lines.push(`- Fit level: ${shopAlignment.fit_level}`);
    }
    if (shopAlignment.fit_summary) {
      lines.push(`- Fit summary: ${shopAlignment.fit_summary}`);
    }
    lines.push('');
  }

  // Risks
  if (risks.length) {
    lines.push('Key Risks');
    lines.push('---------');
    risks.forEach((r) => lines.push(`- ${r}`));
    lines.push('');
  }

  // Opportunities
  if (opps.length) {
    lines.push('Key Opportunities');
    lines.push('-----------------');
    opps.forEach((o) => lines.push(`- ${o}`));
    lines.push('');
  }

  // Cost Drivers
  if (costDrivers.length) {
    lines.push('Cost Drivers');
    lines.push('------------');
    costDrivers.forEach((cd: any, idx: number) => {
      lines.push(`${idx + 1}) ${cd.factor ?? 'Factor'} [${cd.impact ?? '-'}]`);
      if (cd.details) {
        lines.push(`   ${cd.details}`);
      }
      lines.push('');
    });
  }

  // Critical Points
  if (criticalPoints.length) {
    lines.push('Critical Points');
    lines.push('---------------');
    criticalPoints.forEach((cp: any, idx: number) => {
      lines.push(
        `${idx + 1}) ${cp.type ?? 'Feature'} [${cp.importance ?? '-'}]`
      );
      if (cp.description) {
        lines.push(`   ${cp.description}`);
      }
      lines.push('');
    });
  }

  // Process Hints
  if (routing.length || machine.length || inspection.length) {
    lines.push('Process Hints');
    lines.push('-------------');

    if (routing.length) {
      lines.push('');
      lines.push('Routing steps:');
      routing.forEach((s) => lines.push(`- ${s}`));
    }

    if (machine.length) {
      lines.push('');
      lines.push('Machine capability:');
      machine.forEach((s) => lines.push(`- ${s}`));
    }

    if (inspection.length) {
      lines.push('');
      lines.push('Inspection focus:');
      inspection.forEach((s) => lines.push(`- ${s}`));
    }

    lines.push('');
  }

  // Internal Notes
  if (internalNotes.length) {
    lines.push('Internal Notes');
    lines.push('--------------');
    internalNotes.forEach((n: string, idx: number) => {
      lines.push(`${idx + 1}) ${n}`);
    });
    lines.push('');
  }

  return lines.join('\n');
};

export const exportJsonToText = (data: AnyReport, fileName = 'analysis_report') => {
  const safeName = sanitizeFilename(fileName);
  const content = buildTextReport(data);

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}_report.txt`;
  link.click();

  URL.revokeObjectURL(url);
};
