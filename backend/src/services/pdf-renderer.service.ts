import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';

class PdfRendererService {
    /**
     * Renders a given HTML string to a PDF buffer using a headless browser.
     */
    async renderHtmlToPdf(htmlContent: string): Promise<Buffer> {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            });
            
            const page = await browser.newPage();
            
            // Set content and wait until network is idle (to ensure any external fonts load if added later)
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            
            // Generate PDF
            // Note: Our CSS specifies physical dimensions (pt) and @page margins
            const pdfBuffer = await page.pdf({
                printBackground: true,
                preferCSSPageSize: true, // Use the size defined in @page or CSS
            });
            
            return Buffer.from(pdfBuffer);
        } catch (error: any) {
            logger.error('Puppeteer rendering failed:', error);
            throw new Error('Failed to generate PDF document.');
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}

export const pdfRendererService = new PdfRendererService();
