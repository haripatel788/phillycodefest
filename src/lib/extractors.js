import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const supportedTypes = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
];

export function isSupportedFile(file) {
  if (!file) {
    return false;
  }

  return supportedTypes.includes(file.type) || /\.(pdf|txt|docx|jpg|jpeg|png|webp)$/i.test(file.name);
}

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    pages.push(textContent.items.map((item) => item.str).join(' '));
  }

  return pages.join('\n').trim();
}

export async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value.trim();
}

export async function extractTextFromTxt(file) {
  return (await file.text()).trim();
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      resolve(data.includes(',') ? data.split(',')[1] : data);
    };
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

export async function buildAnalyzePayload({ file, pastedText }) {
  const typedText = pastedText?.trim();

  if (typedText) {
    return {
      documentText: typedText,
      sourceName: 'pasted-text',
      sourceType: 'text',
    };
  }

  if (!file) {
    throw new Error('Please upload a file or paste your notice text.');
  }

  const lowerName = file.name.toLowerCase();

  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const text = await extractTextFromPDF(file);
    return { documentText: text, sourceName: file.name, sourceType: 'pdf' };
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    const text = await extractTextFromDocx(file);
    return { documentText: text, sourceName: file.name, sourceType: 'docx' };
  }

  if (file.type === 'text/plain' || lowerName.endsWith('.txt')) {
    const text = await extractTextFromTxt(file);
    return { documentText: text, sourceName: file.name, sourceType: 'txt' };
  }

  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(lowerName)) {
    const imageBase64 = await fileToBase64(file);
    return {
      imageBase64,
      imageMimeType: file.type || 'image/jpeg',
      sourceName: file.name,
      sourceType: 'image',
    };
  }

  throw new Error('Unsupported file type. Please upload PDF, TXT, DOCX, JPG, PNG, or WEBP.');
}
