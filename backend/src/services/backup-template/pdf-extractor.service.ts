import fs from "node:fs/promises";

import * as pdfjsLib
    from "pdfjs-dist/legacy/build/pdf.mjs";

import {
    PDFDocumentStructure,
    PDFElement,
} from "@/types/pdf.types";

import {
    extractText,
} from "./pdf-text.service";

import {
    extractGraphics,
} from "./pdf-graphics.service";

import {
    detectTables,
} from "./pdf-table.service";


export class PDFExtractorService {

    async extract(
        filePath: string
    ): Promise<PDFDocumentStructure> {

        const buffer =
            await fs.readFile(
                filePath
            );


        const pdf =
            await pdfjsLib
                .getDocument({
                    data:
                        new Uint8Array(
                            buffer
                        ),
                })
                .promise;


        const pages = [];


        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            const page =
                await pdf.getPage(
                    pageNumber
                );


            const viewport =
                page.getViewport({
                    scale: 1,
                });


            // -----------------------------
            // TEXT
            // -----------------------------

            const textElements =
                await extractText(
                    page,
                    pageNumber,
                    viewport
                );


            // -----------------------------
            // GRAPHICS + IMAGES
            // -----------------------------

            const graphicElements =
                await extractGraphics(
                    page,
                    viewport,
                    pageNumber
                );


            // -----------------------------
            // COMBINE
            // -----------------------------

            const elements: PDFElement[] = [
                ...textElements,
                ...graphicElements,
            ];


            // -----------------------------
            // TABLES
            // -----------------------------

            const tables =
                detectTables(
                    elements,
                    pageNumber
                );


            elements.push(
                ...tables
            );


            // -----------------------------
            // SORT BY POSITION
            // -----------------------------

            const getElementY = (el: PDFElement): number => {
                if ("y" in el && typeof el.y === "number") return el.y;
                if ("y1" in el && typeof el.y1 === "number") return el.y1;
                if ("points" in el && el.points?.[0]) return el.points[0].y;
                return 0;
            };

            elements.sort((a, b) => getElementY(a) - getElementY(b));


            pages.push({
                pageNumber,

                width:
                    viewport.width,

                height:
                    viewport.height,

                elements,
            });
        }


        return {
            pageCount:
                pdf.numPages,

            pages,
        };
    }
}