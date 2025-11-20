// src/utils/filename.ts

export const sanitizeFilename = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, '_')              // spaces -> _
    .replace(/[^a-zA-Z0-9_\-\.]/g, ''); // remove unsafe chars
