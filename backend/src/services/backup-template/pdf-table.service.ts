import {
    PDFElement,
    PDFLineElement,
    PDFRectangleElement,
    PDFTableElement,
} from "@/types/pdf.types";


export function detectTables(
    elements: PDFElement[],
    pageNumber: number
): PDFTableElement[] {

    const rectangles =
        elements.filter(
            (
                element
            ): element is PDFRectangleElement =>
                element.type === "rectangle"
        );

    const lines =
        elements.filter(
            (
                element
            ): element is PDFLineElement =>
                element.type === "line"
        );

    const horizontalLines =
        lines.filter(
            line =>
                Math.abs(
                    line.y1 - line.y2
                ) <= 2
        );

    const verticalLines =
        lines.filter(
            line =>
                Math.abs(
                    line.x1 - line.x2
                ) <= 2
        );

    const tables: PDFTableElement[] = [];


    for (
        const rectangle of rectangles
    ) {

        const insideHorizontal =
            horizontalLines.filter(
                line =>
                    line.x1 >= rectangle.x &&
                    line.x2 <=
                    rectangle.x +
                    rectangle.width
            );

        const insideVertical =
            verticalLines.filter(
                line =>
                    line.y1 >= rectangle.y &&
                    line.y2 <=
                    rectangle.y +
                    rectangle.height
            );


        if (
            insideHorizontal.length < 2 ||
            insideVertical.length < 2
        ) {
            continue;
        }


        const rowPositions =
            uniquePositions(
                insideHorizontal.map(
                    line => line.y1
                )
            );

        const columnPositions =
            uniquePositions(
                insideVertical.map(
                    line => line.x1
                )
            );


        if (
            rowPositions.length < 2 ||
            columnPositions.length < 2
        ) {
            continue;
        }


        const cells = [];


        for (
            let row = 0;
            row <
            rowPositions.length - 1;
            row++
        ) {

            for (
                let column = 0;
                column <
                columnPositions.length - 1;
                column++
            ) {

                cells.push({
                    row,
                    column,

                    x:
                        columnPositions[
                        column
                        ],

                    y:
                        rowPositions[
                        row
                        ],

                    width:
                        columnPositions[
                        column + 1
                        ] -
                        columnPositions[
                        column
                        ],

                    height:
                        rowPositions[
                        row + 1
                        ] -
                        rowPositions[
                        row
                        ],
                });
            }
        }


        tables.push({
            id:
                `table-${pageNumber}-${tables.length}`,

            type: "table",

            x: rectangle.x,
            y: rectangle.y,

            width: rectangle.width,
            height: rectangle.height,

            rows:
                rowPositions.length - 1,

            columns:
                columnPositions.length - 1,

            cells,

            page: pageNumber,
        });
    }


    return tables;
}


function uniquePositions(
    values: number[],
    tolerance = 2
): number[] {

    const sorted =
        [...values].sort(
            (a, b) => a - b
        );

    const result: number[] = [];


    for (
        const value of sorted
    ) {

        const exists =
            result.some(
                existing =>
                    Math.abs(
                        existing - value
                    ) <= tolerance
            );

        if (!exists) {
            result.push(value);
        }
    }


    return result;
}