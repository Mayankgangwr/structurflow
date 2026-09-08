export interface PDFPoint {
    x: number;
    y: number;
}

export interface PDFTextElement {
    id: string;
    type: "text";

    text: string;

    x: number;
    y: number;

    width: number;
    height: number;

    fontSize: number;

    page: number;
}

export interface PDFLineElement {
    id: string;
    type: "line";

    x1: number;
    y1: number;

    x2: number;
    y2: number;

    width: number;

    page: number;
}

export interface PDFRectangleElement {
    id: string;
    type: "rectangle";

    x: number;
    y: number;

    width: number;
    height: number;

    page: number;
}

export interface PDFImageElement {
    id: string;
    type: "image";

    name: string;

    x?: number;
    y?: number;

    width?: number;
    height?: number;

    page: number;
}

export interface PDFPathElement {
    id: string;
    type: "path";

    points: PDFPoint[];

    page: number;
}

export interface PDFTableCell {
    row: number;
    column: number;

    x: number;
    y: number;

    width: number;
    height: number;
}

export interface PDFTableElement {
    id: string;
    type: "table";

    x: number;
    y: number;

    width: number;
    height: number;

    rows: number;
    columns: number;

    cells: PDFTableCell[];

    page: number;
}

export type PDFElement =
    | PDFTextElement
    | PDFLineElement
    | PDFRectangleElement
    | PDFImageElement
    | PDFPathElement
    | PDFTableElement;

export interface PDFPage {
    pageNumber: number;

    width: number;
    height: number;

    elements: PDFElement[];
}

export interface PDFDocumentStructure {
    pageCount: number;

    pages: PDFPage[];
}