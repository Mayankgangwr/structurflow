import { PDFElement, PDFPoint } from "@/types/pdf.types";
import { convertPdfPoint } from "@/utils/backup-template/pdf-coordinate.util";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";




export async function extractGraphics(
    page: any,
    viewport: any,
    pageNumber: number
): Promise<PDFElement[]> {

    const operatorList =
        await page.getOperatorList();

    const elements: PDFElement[] = [];

    let lineWidth = 1;

    let currentPath: PDFPoint[] = [];

    let elementIndex = 0;


    for (
        let i = 0;
        i < operatorList.fnArray.length;
        i++
    ) {

        const fn =
            operatorList.fnArray[i];

        const args =
            operatorList.argsArray[i];


        // -----------------------------
        // LINE WIDTH
        // -----------------------------

        if (
            fn ===
            pdfjsLib.OPS.setLineWidth
        ) {

            lineWidth =
                args?.[0] ?? 1;

            continue;
        }


        // -----------------------------
        // MOVE TO
        // -----------------------------

        if (
            fn ===
            pdfjsLib.OPS.moveTo
        ) {

            const point =
                convertPdfPoint(
                    viewport,
                    args[0],
                    args[1]
                );

            currentPath = [point];

            continue;
        }


        // -----------------------------
        // LINE TO
        // -----------------------------

        if (
            fn ===
            pdfjsLib.OPS.lineTo
        ) {

            const point =
                convertPdfPoint(
                    viewport,
                    args[0],
                    args[1]
                );

            if (
                currentPath.length > 0
            ) {

                const previous =
                    currentPath[
                    currentPath.length - 1
                    ];

                elements.push({
                    id:
                        `line-${pageNumber}-${elementIndex++}`,

                    type: "line",

                    x1: previous.x,
                    y1: previous.y,

                    x2: point.x,
                    y2: point.y,

                    width: lineWidth,

                    page: pageNumber,
                });
            }

            currentPath.push(point);

            continue;
        }


        // -----------------------------
        // RECTANGLE
        // -----------------------------

        if (
            fn ===
            pdfjsLib.OPS.rectangle
        ) {

            const [
                x,
                y,
                width,
                height,
            ] = args;

            const topLeft =
                convertPdfPoint(
                    viewport,
                    x,
                    y + height
                );

            elements.push({
                id:
                    `rectangle-${pageNumber}-${elementIndex++}`,

                type: "rectangle",

                x: topLeft.x,
                y: topLeft.y,

                width,
                height,

                page: pageNumber,
            });

            continue;
        }


        // -----------------------------
        // CURVE
        // -----------------------------

        if (
            fn ===
            pdfjsLib.OPS.curveTo
        ) {

            const [
                x1,
                y1,
                x2,
                y2,
                x3,
                y3,
            ] = args;

            currentPath.push(
                convertPdfPoint(
                    viewport,
                    x1,
                    y1
                ),

                convertPdfPoint(
                    viewport,
                    x2,
                    y2
                ),

                convertPdfPoint(
                    viewport,
                    x3,
                    y3
                )
            );

            continue;
        }


        // -----------------------------
        // STROKE PATH
        // -----------------------------

        if (
            fn ===
            pdfjsLib.OPS.stroke ||
            fn ===
            pdfjsLib.OPS.closeStroke
        ) {

            if (
                currentPath.length > 1
            ) {

                elements.push({
                    id:
                        `path-${pageNumber}-${elementIndex++}`,

                    type: "path",

                    points: [
                        ...currentPath,
                    ],

                    page: pageNumber,
                });
            }

            currentPath = [];

            continue;
        }


        // -----------------------------
        // IMAGE
        // -----------------------------

        if (
            fn ===
            pdfjsLib.OPS
                .paintImageXObject ||

            fn ===
            pdfjsLib.OPS
                .paintImageMaskXObject ||

            fn ===
            pdfjsLib.OPS
                .paintSolidColorImageMask
        ) {

            elements.push({
                id:
                    `image-${pageNumber}-${elementIndex++}`,

                type: "image",

                name:
                    args?.[0] ??
                    `image-${elementIndex}`,

                page: pageNumber,
            });

            continue;
        }
    }

    return elements;
}