import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { logger } from '@/utils/logger';

export interface PdfTextElement {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontFamily: string;
    fontSize: number;
}

export interface PdfPageData {
    pageNumber: number;
    width: number;
    height: number;
    items: PdfTextElement[];
}

export interface ParsedPdfData {
    rawText: string;
    pages: number;
    metadata: Record<string, any>;
    pageData: PdfPageData[];
}

class PdfParserService {
    async extractFromUrl(pdfUrl: string): Promise<ParsedPdfData> {
        try {
            // 1. Download the PDF
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error(`Failed to download PDF: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // 2. Load PDF using pdfjs-dist
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
            const pdfDocument = await loadingTask.promise;
            
            let fullText = '';
            const pagesCount = pdfDocument.numPages;
            const pageData: PdfPageData[] = [];
            
            const metadata = await pdfDocument.getMetadata();

            // 3. Process each page
            for (let i = 1; i <= pagesCount; i++) {
                const page = await pdfDocument.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 });
                const textContent = await page.getTextContent();
                
                const pageHeight = viewport.height;
                const pageWidth = viewport.width;
                
                const items: PdfTextElement[] = [];
                let pageText = '';
                
                for (const item of textContent.items as any[]) {
                    // transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
                    const transform = item.transform;
                    const pdfX = transform[4];
                    const pdfY = transform[5]; // Baseline from bottom
                    const fontSize = transform[0]; // ScaleX is often font size
                    const width = item.width;
                    const height = item.height;
                    
                    // Convert bottom-left baseline Y to top-left Y
                    const htmlY = pageHeight - pdfY - fontSize;
                    
                    items.push({
                        text: item.str,
                        x: pdfX,
                        y: htmlY,
                        width: width,
                        height: height,
                        fontFamily: item.fontName || 'sans-serif',
                        fontSize: fontSize
                    });
                    
                    pageText += item.str + (item.hasEOL ? '\n' : ' ');
                }
                
                pageData.push({
                    pageNumber: i,
                    width: pageWidth,
                    height: pageHeight,
                    items: items
                });
                
                fullText += pageText + '\n\n';
            }

            return {
                rawText: fullText.trim(),
                pages: pagesCount,
                metadata: metadata.info || {},
                pageData: pageData
            };
        } catch (error: any) {
            logger.error('PDF Parser Error:', error);
            throw new Error(`PDF extraction failed: ${error.message}`);
        }
    }
}

export const pdfParserService = new PdfParserService();
