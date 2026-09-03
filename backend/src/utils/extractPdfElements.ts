import * as fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// ==========================================
// Types & Interfaces
// ==========================================

export interface BaseElement {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TextElement extends BaseElement {
    type: "text";
    text: string;
    fontSize: number;
    fontName?: string;
    isBold?: boolean;
    color?: string;
}

export interface LineElement extends BaseElement {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    strokeWidth: number;
    strokeColor?: string;
    orientation: "horizontal" | "vertical" | "diagonal";
}

export interface RectangleElement extends BaseElement {
    type: "rectangle";
    strokeWidth?: number;
    strokeColor?: string;
    fillColor?: string;
    isFilled: boolean;
    isStroked: boolean;
}

export interface ImageElement extends BaseElement {
    type: "image";
    id: string;
}

export interface TableCell {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TableElement extends BaseElement {
    type: "table";
    rowCount: number;
    colCount: number;
    headers?: string[];
    rows: TableCell[][];
}

export type ExtractedElement = TextElement | LineElement | RectangleElement | ImageElement | TableElement;

export interface ExtractedPdfElements extends Array<ExtractedElement> {
    pageCount: number;
    pages: Array<{
        pageNumber: number;
        width: number;
        height: number;
        backgroundColor?: string;
    }>;
    pageBackgroundColors?: Record<number, string>;
    elements: ExtractedElement[];
    texts: TextElement[];
    lines: LineElement[];
    rectangles: RectangleElement[];
    images: ImageElement[];
    tables: TableElement[];
}

// ==========================================
// Helper Utilities for 2D Transforms & Colors
// ==========================================

type Matrix = [number, number, number, number, number, number];

function identityMatrix(): Matrix {
    return [1, 0, 0, 1, 0, 0];
}

function multiplyMatrix(m1: Matrix, m2: Matrix): Matrix {
    return [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
}

function transformPoint(p: [number, number], m: Matrix): [number, number] {
    return [
        m[0] * p[0] + m[2] * p[1] + m[4],
        m[1] * p[0] + m[3] * p[1] + m[5],
    ];
}

function normalizeColor(args: any[]): string | undefined {
    if (!args || args.length === 0) return undefined;
    if (typeof args[0] === "string") return args[0];

    if (args.length >= 3 && typeof args[0] === "number") {
        const r = Math.round(Math.min(1, Math.max(0, args[0])) * 255);
        const g = Math.round(Math.min(1, Math.max(0, args[1])) * 255);
        const b = Math.round(Math.min(1, Math.max(0, args[2])) * 255);
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }

    if (args.length === 1 && typeof args[0] === "number") {
        const v = Math.round(Math.min(1, Math.max(0, args[0])) * 255);
        return `#${v.toString(16).padStart(2, "0")}${v.toString(16).padStart(2, "0")}${v.toString(16).padStart(2, "0")}`;
    }

    return undefined;
}

// ==========================================
// Table Detection Heuristic
// ==========================================

function detectTables(pageTexts: TextElement[], pageNumber: number): TableElement[] {
    if (pageTexts.length < 4) return [];

    // Group texts by Y coordinate into visual rows (tolerance of 4pt)
    const rowsMap = new Map<number, TextElement[]>();
    for (const item of pageTexts) {
        let foundY = false;
        for (const existingY of rowsMap.keys()) {
            if (Math.abs(existingY - item.y) <= 4) {
                rowsMap.get(existingY)!.push(item);
                foundY = true;
                break;
            }
        }
        if (!foundY) {
            rowsMap.set(item.y, [item]);
        }
    }

    // Sort rows from top to bottom
    const sortedY = Array.from(rowsMap.keys()).sort((a, b) => b - a);

    const tables: TableElement[] = [];
    let currentTableRows: TextElement[][] = [];
    let prevRowY: number | null = null;
    let expectedCols: number | null = null;

    for (const y of sortedY) {
        const rowItems = rowsMap.get(y)!.sort((a, b) => a.x - b.x);

        // A tabular row usually has 2 or more distinct columns
        const isMultiCol = rowItems.length >= 2;

        if (isMultiCol) {
            const rowSpacing = prevRowY !== null ? Math.abs(prevRowY - y) : null;
            const hasConsistentSpacing = rowSpacing === null || (rowSpacing >= 12 && rowSpacing <= 40);

            if (hasConsistentSpacing && (expectedCols === null || Math.abs(rowItems.length - expectedCols) <= 1)) {
                currentTableRows.push(rowItems);
                expectedCols = rowItems.length;
                prevRowY = y;
                continue;
            }
        }

        // Flush accumulated table if consecutive row sequence ends
        if (currentTableRows.length >= 2) {
            tables.push(buildTableElement(currentTableRows, pageNumber));
        }
        currentTableRows = isMultiCol ? [rowItems] : [];
        expectedCols = isMultiCol ? rowItems.length : null;
        prevRowY = isMultiCol ? y : null;
    }

    if (currentTableRows.length >= 2) {
        tables.push(buildTableElement(currentTableRows, pageNumber));
    }

    return tables;
}

function buildTableElement(rows: TextElement[][], pageNumber: number): TableElement {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let maxCols = 0;

    const formattedRows: TableCell[][] = rows.map((row) => {
        maxCols = Math.max(maxCols, row.length);
        return row.map((item) => {
            minX = Math.min(minX, item.x);
            maxX = Math.max(maxX, item.x + item.width);
            minY = Math.min(minY, item.y);
            maxY = Math.max(maxY, item.y + item.height);

            return {
                text: item.text,
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
            };
        });
    });

    const headers = formattedRows[0]?.map((c) => c.text);

    return {
        type: "table",
        page: pageNumber,
        x: Math.round(minX * 100) / 100,
        y: Math.round(minY * 100) / 100,
        width: Math.round((maxX - minX) * 100) / 100,
        height: Math.round((maxY - minY) * 100) / 100,
        rowCount: formattedRows.length,
        colCount: maxCols,
        headers,
        rows: formattedRows,
    };
}

// ==========================================
// Main Extraction Function
// ==========================================

export const extractPdfElements = async (params: {
    filePath?: string;
    fileBuffer?: Buffer | Uint8Array | ArrayBuffer;
}): Promise<ExtractedPdfElements | null> => {
    const { fileBuffer, filePath } = params;
    if (!fileBuffer && !filePath) return null;

    let pdfBuffer: any = fileBuffer;
    if (filePath) {
        pdfBuffer = fs.readFileSync(filePath);
    }

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
    }).promise;

    const allElements: ExtractedElement[] = [];
    const texts: TextElement[] = [];
    const lines: LineElement[] = [];
    const rectangles: RectangleElement[] = [];
    const images: ImageElement[] = [];
    const tables: TableElement[] = [];
    const pagesInfo: Array<{ pageNumber: number; width: number; height: number; backgroundColor?: string }> = [];
    const pageBackgroundColors: Record<number, string> = {};

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        let pageBgColor: string = "#faf8f5";

        // -------------------------------------------------------------
        // 1. Extract Text Elements
        // -------------------------------------------------------------
        const textContent = await page.getTextContent();
        const pageTexts: TextElement[] = [];

        for (const item of textContent.items) {
            if (!("str" in item)) continue;

            const text = item.str.trim();
            if (!text) continue;

            const transform = item.transform;
            const x = Math.round(transform[4] * 100) / 100;
            const y = Math.round(transform[5] * 100) / 100;
            const fontSize = Math.round(Math.abs(transform[0]) * 10) / 10;

            const textElement: TextElement = {
                type: "text",
                page: pageNumber,
                text,
                x,
                y,
                width: Math.round(item.width * 100) / 100,
                height: Math.round(item.height * 100) / 100,
                fontSize,
                fontName: (item as any).fontName,
            };

            pageTexts.push(textElement);
            texts.push(textElement);
            allElements.push(textElement);
        }

        // -------------------------------------------------------------
        // 2. Extract Vector Paths (Lines, Rectangles) & Images
        // -------------------------------------------------------------
        const opList = await page.getOperatorList();
        const OPS = pdfjsLib.OPS;

        // Resolve font weights and detect bold fonts (Nimbus-Sans-Bold, Helvetica-Bold, etc.)
        for (const t of pageTexts) {
            if (t.fontName && page.commonObjs.has(t.fontName)) {
                const fontObj = page.commonObjs.get(t.fontName);
                const fontRealName = fontObj?.name || "";
                t.isBold = /bold|heavy|black|semibold/i.test(fontRealName);
            }
        }

        let ctm: Matrix = identityMatrix();
        const ctmStack: Matrix[] = [];
        let currentLineWidth = 1;
        let currentStrokeColor: string | undefined = undefined;
        let currentFillColor: string | undefined = undefined;

        for (let i = 0; i < opList.fnArray.length; i++) {
            const fn = opList.fnArray[i];
            const args = opList.argsArray[i];

            // Transform & Matrix Tracking
            if (fn === OPS.save) {
                ctmStack.push([...ctm]);
            } else if (fn === OPS.restore) {
                if (ctmStack.length > 0) {
                    ctm = ctmStack.pop()!;
                }
            } else if (fn === OPS.transform) {
                if (Array.isArray(args) && args.length >= 6) {
                    ctm = multiplyMatrix(ctm, args as Matrix);
                }
            } else if (fn === OPS.setLineWidth) {
                currentLineWidth = Number(args?.[0]) || 1;
            } else if (
                fn === OPS.setStrokeRGBColor ||
                fn === OPS.setStrokeColor ||
                fn === OPS.setStrokeColorN ||
                fn === OPS.setStrokeGray
            ) {
                currentStrokeColor = normalizeColor(args);
            } else if (
                fn === OPS.setFillRGBColor ||
                fn === OPS.setFillColor ||
                fn === OPS.setFillColorN ||
                fn === OPS.setFillGray
            ) {
                currentFillColor = normalizeColor(args);
            }

            // Image Operations
            else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
                const imgId = String(args?.[0] || `img_p${pageNumber}_${i}`);
                const imgX = Math.round(ctm[4] * 100) / 100;
                const imgY = Math.round(ctm[5] * 100) / 100;
                const imgW = Math.round(Math.hypot(ctm[0], ctm[1]) * 100) / 100;
                const imgH = Math.round(Math.hypot(ctm[2], ctm[3]) * 100) / 100;

                if (imgW > 0 && imgH > 0) {
                    const imgElement: ImageElement = {
                        type: "image",
                        page: pageNumber,
                        id: imgId,
                        x: imgX,
                        y: imgY,
                        width: imgW,
                        height: imgH,
                    };
                    images.push(imgElement);
                    allElements.push(imgElement);
                }
            }

            // Construct Path Operations (Lines, Rectangles, Borders)
            else if (fn === OPS.constructPath) {
                const action = args?.[0]; // 20: stroke, 22/23: fill, 24/25: fillStroke
                const bbox = args?.[2];   // [minX, minY, maxX, maxY]

                if (bbox && bbox.length >= 4) {
                    const minX = bbox[0];
                    const minY = bbox[1];
                    const maxX = bbox[2];
                    const maxY = bbox[3];

                    const p1 = transformPoint([minX, minY], ctm);
                    const p2 = transformPoint([maxX, maxY], ctm);

                    const x = Math.round(Math.min(p1[0], p2[0]) * 100) / 100;
                    const y = Math.round(Math.min(p1[1], p2[1]) * 100) / 100;
                    const w = Math.round(Math.abs(p1[0] - p2[0]) * 100) / 100;
                    const h = Math.round(Math.abs(p1[1] - p2[1]) * 100) / 100;

                    const isFilled = action === 22 || action === 23 || action === 24 || action === 25;
                    const isStroked = action === 20 || action === 24 || action === 25;

                    // Check for full-page canvas background fill
                    if (w >= viewport.width * 0.85 && h >= viewport.height * 0.85) {
                        if (isFilled && currentFillColor) {
                            pageBgColor = currentFillColor;
                        }
                        continue;
                    }

                    // A) Horizontal Line
                    if (w > 2 && h <= 2) {
                        const lineEl: LineElement = {
                            type: "line",
                            page: pageNumber,
                            x,
                            y,
                            x1: x,
                            y1: y,
                            x2: Math.round((x + w) * 100) / 100,
                            y2: y,
                            width: w,
                            height: Math.max(h, currentLineWidth),
                            strokeWidth: currentLineWidth,
                            strokeColor: currentStrokeColor,
                            orientation: "horizontal",
                        };
                        lines.push(lineEl);
                        allElements.push(lineEl);
                    }
                    // B) Vertical Line
                    else if (h > 2 && w <= 2) {
                        const lineEl: LineElement = {
                            type: "line",
                            page: pageNumber,
                            x,
                            y,
                            x1: x,
                            y1: y,
                            x2: x,
                            y2: Math.round((y + h) * 100) / 100,
                            width: Math.max(w, currentLineWidth),
                            height: h,
                            strokeWidth: currentLineWidth,
                            strokeColor: currentStrokeColor,
                            orientation: "vertical",
                        };
                        lines.push(lineEl);
                        allElements.push(lineEl);
                    }
                    // C) Rectangle / Box
                    else if (w > 2 && h > 2) {
                        const rectEl: RectangleElement = {
                            type: "rectangle",
                            page: pageNumber,
                            x,
                            y,
                            width: w,
                            height: h,
                            strokeWidth: isStroked ? currentLineWidth : 0,
                            strokeColor: isStroked ? currentStrokeColor : undefined,
                            fillColor: isFilled ? currentFillColor : undefined,
                            isFilled,
                            isStroked,
                        };
                        rectangles.push(rectEl);
                        allElements.push(rectEl);
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // 3. Detect Table Structures from Aligned Texts & Grids
        // -------------------------------------------------------------
        const pageTables = detectTables(pageTexts, pageNumber);
        for (const table of pageTables) {
            tables.push(table);
            allElements.push(table);
        }

        pageBackgroundColors[pageNumber] = pageBgColor;
        pagesInfo.push({
            pageNumber,
            width: viewport.width,
            height: viewport.height,
            backgroundColor: pageBgColor,
        });
    }

    // Attach categorized lists and metadata onto array for 100% backward compatibility
    const result = allElements as ExtractedPdfElements;
    result.pageCount = pdf.numPages;
    result.pages = pagesInfo;
    result.pageBackgroundColors = pageBackgroundColors;
    result.elements = allElements;
    result.texts = texts;
    result.lines = lines;
    result.rectangles = rectangles;
    result.images = images;
    result.tables = tables;

    return result;
};

export default extractPdfElements;