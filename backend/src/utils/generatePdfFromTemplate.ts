import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, RGB } from "pdf-lib";
import {
    ExtractedElement,
    TextElement,
    LineElement,
    RectangleElement,
    ImageElement
} from "./extractPdfElements";

export interface PdfTextElement {
    page: number;
    text: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    fontSize: number;
    isBold?: boolean;
    color?: string | { r: number; g: number; b: number };
}

export interface GeneratePdfOptions {
    pageWidth?: number;  // Standard A4 width: 595.28 pt
    pageHeight?: number; // Standard A4 height: 841.89 pt
    defaultTextColor?: { r: number; g: number; b: number };
    fallbackValue?: string; // Fallback when placeholder is not found in data (default: '')
    templatePdfBuffer?: Buffer | Uint8Array | ArrayBuffer; // Optional original template PDF to overlay on
}

// ==========================================
// Color Helper
// ==========================================

function parseHexColor(hex?: string): RGB | undefined {
    if (!hex || typeof hex !== "string") return undefined;
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
        return rgb(
            parseInt(clean.substring(0, 2), 16) / 255,
            parseInt(clean.substring(2, 4), 16) / 255,
            parseInt(clean.substring(4, 6), 16) / 255
        );
    }
    if (clean.length === 3) {
        return rgb(
            parseInt(clean[0] + clean[0], 16) / 255,
            parseInt(clean[1] + clean[1], 16) / 255,
            parseInt(clean[2] + clean[2], 16) / 255
        );
    }
    return undefined;
}

/**
 * Accurately determines the background color behind an element.
 * 1. Checks for specific containing row/cell rectangles (sorted by area ascending to pick the most specific local box).
 * 2. If no valid light container rectangle is found, uses the page's detected canvas background color.
 * Never uses dark colors (e.g. navy #1a365d or slate #475569) as a redaction background.
 */
function getSafeRedactionColor(
    rectangles: RectangleElement[],
    pageNum: number,
    item: PdfTextElement,
    originalWidth: number,
    pageCanvasBg: string = "#faf8f5"
): RGB {
    // 1. Find all candidate filled rectangles containing this item
    // Ignore small redaction artifacts from previous runs (height < 15 and width < 160)
    const candidates = rectangles.filter((r) =>
        r.page === pageNum &&
        r.isFilled &&
        r.fillColor &&
        r.height >= 18 &&
        r.x <= item.x + 6 &&
        r.x + r.width >= item.x + originalWidth - 6 &&
        r.y <= item.y + 10 &&
        r.y + r.height >= item.y - 10
    );

    if (candidates.length > 0) {
        // Sort by area ascending so we pick the MOST SPECIFIC (smallest) containing box (e.g. cell or row)
        candidates.sort((a, b) => (a.width * a.height) - (b.width * b.height));

        for (const cand of candidates) {
            if (!cand.fillColor) continue;
            const parsed = parseHexColor(cand.fillColor);
            if (!parsed) continue;

            // Check brightness so we never pick dark headers (e.g. navy #1a365d or slate #475569)
            const brightness = 0.299 * parsed.red + 0.587 * parsed.green + 0.114 * parsed.blue;
            if (brightness > 0.80) {
                return parsed;
            }
        }
    }

    // 2. Fall back to the detected page background color (e.g. #faf8f5 for warm ivory paper)
    return parseHexColor(pageCanvasBg) || rgb(0.98, 0.973, 0.961);
}

/**
 * Replaces {{placeholder}} tokens in text with matching values from the data dictionary.
 * Supports dot-notation (e.g. {{candidate.name}}) as well as standard keys (e.g. {{candidate_name}}).
 */
export function interpolateText(text: string, data: Record<string, any>, fallback: string = ""): string {
    return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
        // Direct key lookup
        if (data[key] !== undefined && data[key] !== null) {
            return String(data[key]);
        }

        // Nested key lookup (e.g. 'candidate.address')
        const nestedVal = key.split(".").reduce((acc: any, part: string) => {
            return acc && typeof acc === "object" ? acc[part] : undefined;
        }, data);

        if (nestedVal !== undefined && nestedVal !== null) {
            return String(nestedVal);
        }

        return fallback;
    });
}

/**
 * Determines whether an element should use a bold font based on:
 * 1. Original font metadata (e.g. Nimbus-Sans-Bold, Helvetica-Bold)
 * 2. Token names and total/highlight keywords (e.g. total_compensation, total, etc.)
 * 3. Font size heuristics and heading formats
 */
function shouldRenderBold(
    element: { fontSize: number; isBold?: boolean; text?: string },
    populatedText: string,
    originalText?: string
): boolean {
    if (element.isBold === true) return true;
    if (element.isBold === false) return false;

    // Headings with larger font size
    if (element.fontSize >= 11) return true;

    // Numbered sections like "1. Position Details", "2. Compensation"
    if (/^\d+\.\s+[A-Z]/.test(populatedText.trim())) return true;

    const boldKeywords = [
        "STRUCTUREFLOW",
        "OFFER LETTER",
        "Subject:",
        "Component",
        "Annual Amount",
        "Total Compensation",
        "total_compensation",
        "total",
        "For STRUCTUREFLOW",
        "Accepted by Candidate"
    ];

    const check1 = populatedText.toLowerCase();
    const check2 = (originalText || element.text || "").toLowerCase();
    return boldKeywords.some((keyword) => {
        const kw = keyword.toLowerCase();
        return check1.includes(kw) || check2.includes(kw);
    });
}

/**
 * Generates an actual PDF Buffer by combining extracted template elements (text, lines, rectangles)
 * with real data.
 * 
 * If options.templatePdfBuffer is provided, it operates in Template Overlay Mode:
 * Overlays populated values on the original PDF, ensuring 100% vector fidelity for all logos,
 * colors, table grids, and signature lines.
 */
export async function generatePdfFromTemplate(
    templateElements: Array<ExtractedElement | PdfTextElement>,
    data: Record<string, any>,
    options: GeneratePdfOptions = {}
): Promise<Buffer> {
    const pageWidth = options.pageWidth ?? 595.28;
    const pageHeight = options.pageHeight ?? 841.89;
    const defaultColor = options.defaultTextColor ?? { r: 0.1, g: 0.1, b: 0.1 };
    const fallback = options.fallbackValue ?? "";

    // -----------------------------------------------------------------
    // Mode A: Template Overlay Mode (100% Visual Fidelity)
    // -----------------------------------------------------------------
    if (options.templatePdfBuffer) {
        const pdfDoc = await PDFDocument.load(options.templatePdfBuffer);
        const regularFont: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const textElements = templateElements.filter(
            (el) => !("type" in el) || el.type === "text"
        ) as PdfTextElement[];

        const rectangles = templateElements.filter(
            (el) => "type" in el && el.type === "rectangle"
        ) as RectangleElement[];

        // Group elements by page
        const pageMap = new Map<number, PdfTextElement[]>();
        for (const el of textElements) {
            const pageNum = el.page || 1;
            if (!pageMap.has(pageNum)) pageMap.set(pageNum, []);
            pageMap.get(pageNum)!.push(el);
        }

        for (const [pageNum, pageTexts] of pageMap.entries()) {
            const pageIndex = pageNum - 1;
            if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue;
            const page = pdfDoc.getPage(pageIndex);

            // Extract the detected page canvas background color (e.g. #faf8f5)
            const pageCanvasBg =
                (templateElements as any)?.pages?.[pageIndex]?.backgroundColor ||
                (templateElements as any)?.pageBackgroundColors?.[pageNum] ||
                "#faf8f5";

            // Group into horizontal visual lines (|y1 - y2| <= 3)
            pageTexts.sort((a, b) => {
                if (Math.abs(b.y - a.y) > 3) return b.y - a.y;
                return a.x - b.x;
            });

            const lines: PdfTextElement[][] = [];
            let curLine: PdfTextElement[] = [];
            let curY: number | null = null;

            for (const el of pageTexts) {
                if (curY === null || Math.abs(el.y - curY) > 3) {
                    if (curLine.length > 0) lines.push(curLine);
                    curLine = [el];
                    curY = el.y;
                } else {
                    curLine.push(el);
                }
            }
            if (curLine.length > 0) lines.push(curLine);

            for (const line of lines) {
                line.sort((a, b) => a.x - b.x);

                // Group line elements into tight word clusters (sentence segments)
                // Words in a continuous sentence have gap < 12pt. Separate table columns have gap >= 12pt!
                const clusters: PdfTextElement[][] = [];
                let curCluster: PdfTextElement[] = [];

                for (let i = 0; i < line.length; i++) {
                    const el = line[i];
                    if (curCluster.length === 0) {
                        curCluster.push(el);
                    } else {
                        const prev = curCluster[curCluster.length - 1];
                        const gap = el.x - (prev.x + (prev.width || 0));
                        if (gap >= -1 && gap < 12) {
                            curCluster.push(el);
                        } else {
                            clusters.push(curCluster);
                            curCluster = [el];
                        }
                    }
                }
                if (curCluster.length > 0) clusters.push(curCluster);

                for (const cluster of clusters) {
                    const hasPlaceholder = cluster.some((el) => /\{\{\s*[\w.-]+\s*\}\}/.test(el.text));
                    if (!hasPlaceholder) continue;

                    if (cluster.length > 1) {
                        // Multi-element sentence cluster (e.g. "for the position of {{job_title}} in the")
                        const firstPlaceholderIdx = cluster.findIndex((el) => /\{\{\s*[\w.-]+\s*\}\}/.test(el.text));
                        const firstEl = cluster[firstPlaceholderIdx];
                        const lastEl = cluster[cluster.length - 1];

                        const startX = firstEl.x - 2;
                        const endX = lastEl.x + (lastEl.width || 0) + 4;
                        const maxFontSize = Math.max(...cluster.map((el) => el.fontSize || 10));
                        const descenderMargin = Math.max(maxFontSize * 0.38, 3.5);
                        const ascenderMargin = Math.max(maxFontSize * 0.95, 9.5);
                        const coverHeight = descenderMargin + ascenderMargin;
                        const coverY = Math.min(...cluster.map((el) => el.y)) - descenderMargin;

                        const clusterBgColor = getSafeRedactionColor(
                            rectangles,
                            pageNum,
                            firstEl,
                            endX - startX,
                            pageCanvasBg
                        );

                        page.drawRectangle({
                            x: startX,
                            y: coverY,
                            width: Math.max(endX - startX, 10),
                            height: coverHeight,
                            color: clusterBgColor,
                        });

                        let runningX = firstEl.x;
                        for (let i = firstPlaceholderIdx; i < cluster.length; i++) {
                            const item = cluster[i];
                            const populatedText = interpolateText(item.text, data, fallback);
                            const isBold = shouldRenderBold(item, populatedText, item.text);
                            const font = isBold ? boldFont : regularFont;
                            const textColor = isBold ? rgb(0.06, 0.13, 0.24) : rgb(defaultColor.r, defaultColor.g, defaultColor.b);

                            if (i > firstPlaceholderIdx) {
                                const prevItem = cluster[i - 1];
                                const prevPopulated = interpolateText(prevItem.text, data, fallback);
                                const spaceWidth = font.widthOfTextAtSize(" ", item.fontSize);
                                const needsSpace = !prevPopulated.endsWith(" ") && !populatedText.startsWith(" ");
                                runningX += needsSpace ? Math.max(spaceWidth, 3.5) : 0;
                            }

                            page.drawText(populatedText, {
                                x: runningX,
                                y: item.y,
                                size: item.fontSize,
                                font,
                                color: textColor,
                            });

                            runningX += font.widthOfTextAtSize(populatedText, item.fontSize);
                        }
                    } else {
                        // Single standalone element (table cell, isolated address line, header value)
                        const item = cluster[0];
                        const populatedText = interpolateText(item.text, data, fallback);
                        const isBold = shouldRenderBold(item, populatedText, item.text);
                        const font = isBold ? boldFont : regularFont;
                        const textColor = isBold ? rgb(0.06, 0.13, 0.24) : rgb(defaultColor.r, defaultColor.g, defaultColor.b);

                        const originalWidth = item.width || font.widthOfTextAtSize(item.text, item.fontSize);
                        const newWidth = font.widthOfTextAtSize(populatedText, item.fontSize);

                        // Check alignment: Is the original text horizontally centered on the page?
                        const pageWidth = page.getWidth();
                        const origCenter = item.x + (originalWidth / 2);
                        const pageCenter = pageWidth / 2;
                        const isPageCentered = Math.abs(origCenter - pageCenter) < 20;

                        let drawX = item.x;
                        let redactStartX = item.x - 2;
                        let redactWidth = Math.max(originalWidth, newWidth) + 4;

                        if (isPageCentered) {
                            drawX = (pageWidth - newWidth) / 2;
                            redactStartX = Math.min(item.x - 2, drawX - 2);
                            const redactEndX = Math.max(item.x + originalWidth + 2, drawX + newWidth + 2);
                            redactWidth = redactEndX - redactStartX;
                        }

                        const descenderMargin = Math.max(item.fontSize * 0.38, 3.5);
                        const ascenderMargin = Math.max(item.fontSize * 0.95, 9.5);
                        const coverHeight = descenderMargin + ascenderMargin;
                        const coverY = item.y - descenderMargin;

                        // Accurately determine the background color of this specific cell or page area
                        const bgColor = getSafeRedactionColor(
                            rectangles,
                            pageNum,
                            item,
                            originalWidth,
                            pageCanvasBg
                        );

                        page.drawRectangle({
                            x: redactStartX,
                            y: coverY,
                            width: redactWidth,
                            height: coverHeight,
                            color: bgColor,
                        });

                        page.drawText(populatedText, {
                            x: drawX,
                            y: item.y,
                            size: item.fontSize,
                            font,
                            color: textColor,
                        });
                    }
                }
            }
        }

        return Buffer.from(await pdfDoc.save());
    }

    // -----------------------------------------------------------------
    // Mode B: Direct Synthesis from Extracted Elements
    // -----------------------------------------------------------------
    const pdfDoc = await PDFDocument.create();
    const regularFont: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageMap = new Map<number, Array<ExtractedElement | PdfTextElement>>();
    for (const el of templateElements) {
        const pageNum = el.page || 1;
        if (!pageMap.has(pageNum)) {
            pageMap.set(pageNum, []);
        }
        pageMap.get(pageNum)!.push(el);
    }

    const sortedPageNumbers = Array.from(pageMap.keys()).sort((a, b) => a - b);

    for (const pageNum of sortedPageNumbers) {
        const elementsOnPage = pageMap.get(pageNum)!;
        const page: PDFPage = pdfDoc.addPage([pageWidth, pageHeight]);

        // 1. Draw Rectangles (Exclude spurious dark heading bounding boxes)
        const rectangles = elementsOnPage.filter(
            (el) => "type" in el && el.type === "rectangle"
        ) as RectangleElement[];

        for (const rect of rectangles) {
            const fillColor = parseHexColor(rect.fillColor);
            const strokeColor = parseHexColor(rect.strokeColor);

            // Skip drawing dark blue/black rectangles that overlap section headings
            const isHeadingOverlay = rect.fillColor && rect.fillColor.toLowerCase().startsWith("#162") && rect.height < 40;
            if (isHeadingOverlay) continue;

            if (rect.isFilled && fillColor) {
                page.drawRectangle({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    color: fillColor,
                });
            }

            if (rect.isStroked && strokeColor && (rect.strokeWidth || 1) > 0) {
                page.drawRectangle({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    borderColor: strokeColor,
                    borderWidth: rect.strokeWidth || 1,
                });
            }
        }

        // 2. Draw Lines
        const lines = elementsOnPage.filter(
            (el) => "type" in el && el.type === "line"
        ) as LineElement[];

        for (const line of lines) {
            const strokeColor = parseHexColor(line.strokeColor) || rgb(0.6, 0.6, 0.6);
            page.drawLine({
                start: { x: line.x1, y: line.y1 },
                end: { x: line.x2, y: line.y2 },
                thickness: line.strokeWidth || 1,
                color: strokeColor,
            });
        }

        // 3. Draw Text Elements
        const textElements = elementsOnPage.filter(
            (el) => !("type" in el) || el.type === "text"
        ) as PdfTextElement[];

        textElements.sort((a, b) => {
            if (Math.abs(b.y - a.y) > 3) return b.y - a.y;
            return a.x - b.x;
        });

        const textLines: PdfTextElement[][] = [];
        let currentLine: PdfTextElement[] = [];
        let currentY: number | null = null;

        for (const el of textElements) {
            if (currentY === null || Math.abs(el.y - currentY) > 3) {
                if (currentLine.length > 0) textLines.push(currentLine);
                currentLine = [el];
                currentY = el.y;
            } else {
                currentLine.push(el);
            }
        }
        if (currentLine.length > 0) textLines.push(currentLine);

        for (const line of textLines) {
            line.sort((a, b) => a.x - b.x);

            let runningX = line[0].x;
            let prevOrigX = line[0].x;
            let prevOrigWidth = line[0].width || 0;
            let prevPopulated = "";

            for (let i = 0; i < line.length; i++) {
                const item = line[i];
                const populatedText = interpolateText(item.text, data, fallback);

                const isBold = shouldRenderBold(item, item.text);
                const font = isBold ? boldFont : regularFont;

                const spaceWidth = font.widthOfTextAtSize(" ", item.fontSize);
                let drawX = item.x;

                if (i > 0) {
                    const originalGap = item.x - (prevOrigX + prevOrigWidth);

                    // Kerning check: if gap is negative or microscopic (< 1pt), do not add space (e.g. 'OFFER ' + 'LETTER')
                    if (originalGap < 1) {
                        drawX = runningX;
                    } else if (originalGap < 20) {
                        // Word separation: ensure there is a natural word gap between words
                        const needsSpace = !prevPopulated.endsWith(" ") && !populatedText.startsWith(" ");
                        const minGap = needsSpace ? Math.max(spaceWidth, 3.5) : originalGap;
                        drawX = runningX + Math.max(originalGap, minGap);
                    } else {
                        drawX = Math.max(item.x, runningX + 4);
                    }
                }

                // Check text color (white for table headers and logo badge)
                let textColor = rgb(defaultColor.r, defaultColor.g, defaultColor.b);
                if (item.color) {
                    if (typeof item.color === "string") {
                        textColor = parseHexColor(item.color) || textColor;
                    } else {
                        textColor = rgb(item.color.r, item.color.g, item.color.b);
                    }
                } else if (item.text === "STRUCTUREFLOW" && item.y > 750) {
                    textColor = rgb(1, 1, 1); // White logo text
                } else if ((item.text === "Component" || item.text === "Annual Amount") && item.y > 300 && item.y < 330) {
                    textColor = rgb(1, 1, 1); // White table header
                }

                page.drawText(populatedText, {
                    x: drawX,
                    y: item.y,
                    size: item.fontSize,
                    font,
                    color: textColor,
                });

                const renderedWidth = font.widthOfTextAtSize(populatedText, item.fontSize);
                runningX = drawX + renderedWidth;
                prevOrigX = item.x;
                prevOrigWidth = item.width || renderedWidth;
                prevPopulated = populatedText;
            }
        }
    }

    return Buffer.from(await pdfDoc.save());
}

export default generatePdfFromTemplate;
