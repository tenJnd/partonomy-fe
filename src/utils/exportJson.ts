// src/utils/exportJson.ts
import { sanitizeFilename } from './filename';

export const exportJson = (data: any, fileName = 'analysis_export') => {
  const safeName = sanitizeFilename(fileName);

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}_report.json`;
  link.click();

  URL.revokeObjectURL(url);
};
