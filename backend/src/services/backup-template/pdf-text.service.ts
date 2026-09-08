import { PDFTextElement } from "@/types/pdf.types";

export async function extractText(
    page: any,
    pageNumber: number,
    viewport: any
): Promise<PDFTextElement[]> {

    const textContent =
        await page.getTextContent();

    const elements: PDFTextElement[] = [];

    let index = 0;

    for (const item of textContent.items) {

        if (!("str" in item)) {
            continue;
        }

        const text = item.str?.trim();

        if (!text) {
            continue;
        }

        const transform = item.transform;

        const x = transform[4];

        const y =
            viewport.height -
            transform[5];

        const fontSize = Math.sqrt(
            transform[0] ** 2 +
            transform[1] ** 2
        );

        elements.push({
            id: `text-${pageNumber}-${index++}`,

            type: "text",

            text,

            x,
            y,

            width: item.width || 0,

            height:
                item.height ||
                fontSize,

            fontSize,

            page: pageNumber,
        });
    }

    return elements;
}