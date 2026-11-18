import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Both clean Vercel projects share one template and static design. Select the
// resume and Eigenvale entry by project so branch-preview URLs agree as well.
const variants = {
  sharonbasovich: 'Sharon_Basovich_Resume.pdf',
  sharonb: 'Sharon_Basovich_Resume_Current.pdf',
};
const variant = process.env.PORTFOLIO_RESUME_VARIANT ?? 'sharonbasovich';

if (!Object.hasOwn(variants, variant)) {
  throw new Error(`Unknown PORTFOLIO_RESUME_VARIANT ${JSON.stringify(variant)}. Use sharonbasovich or sharonb.`);
}

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = join(projectRoot, 'dist');
if (!existsSync(outputRoot)) {
  throw new Error('Shared dist directory is missing; refusing to generate an incomplete site.');
}

const template = readFileSync(join(projectRoot, 'templates', 'clean-index.html'), 'utf8');
const startMarker = '<!-- eigenvale:start -->';
const endMarker = '<!-- eigenvale:end -->';
const start = template.indexOf(startMarker);
const end = template.indexOf(endMarker);
if (
  start < 0 || end < 0 || start >= end ||
  template.indexOf(startMarker, start + startMarker.length) !== -1 ||
  template.indexOf(endMarker, end + endMarker.length) !== -1
) {
  throw new Error('The clean template must contain exactly one balanced eigenvale:start/eigenvale:end marker pair.');
}
const html = template.slice(0, start) +
  (variant === 'sharonb' ? template.slice(start + startMarker.length, end) : '') +
  template.slice(end + endMarker.length);

const source = join(projectRoot, 'resumes', variants[variant]);
const pdf = readFileSync(source);
if (pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
  throw new Error(`Resume source is not a PDF: ${variants[variant]}`);
}

// Validate all inputs above before replacing any generated output.
writeFileSync(join(outputRoot, 'index.html'), html, 'utf8');
for (const name of ['Sharon_Basovich_Resume.pdf', 'resume.pdf']) {
  writeFileSync(join(outputRoot, name), pdf);
}

const hash = createHash('sha256').update(pdf).digest('hex');
console.log(`Resume variant: ${variant}; ${pdf.length} bytes; SHA-256 ${hash}`);
