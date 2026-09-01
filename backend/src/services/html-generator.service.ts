import { ParsedPdfData } from "./pdf-parser.service";

export interface FieldMapping {
    [originalText: string]: string; // e.g. "John Doe": "{{employee_name}}"
}

class HtmlGeneratorService {
    /**
     * Generates an absolute-positioned HTML document matching the PDF dimensions.
     * Replaces literals found in the fieldMapping with their placeholders.
     */
    generateTemplate(pdfData: ParsedPdfData, fieldMapping: FieldMapping): string {
        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { margin: 0; padding: 0; background: #e5e7eb; display: flex; flex-direction: column; align-items: center; font-family: sans-serif; }
        .pdf-document { display: flex; flex-direction: column; gap: 20px; padding: 20px 0; }
        .pdf-page { 
            position: relative; 
            background: white; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); 
            overflow: hidden;
            page-break-after: always;
        }
        .text-element { 
            position: absolute; 
            white-space: pre; 
            line-height: 1; 
            transform-origin: top left;
        }
        @page { margin: 0; }
        @media print {
            body { background: white; display: block; }
            .pdf-document { padding: 0; gap: 0; }
            .pdf-page { box-shadow: none; }
        }
    </style>
</head>
<body>
<div class="pdf-document">
`;

        for (const page of pdfData.pageData) {
            // Using points (pt) for near 1:1 mapping with PDF coordinates
            html += `  <div class="pdf-page" style="width: ${page.width}pt; height: ${page.height}pt;">\n`;

            for (const item of page.items) {
                // Determine if this text matches any mapped dynamic field
                let textContent = item.text;

                // Do a simple replacement based on the mapping
                for (const [literal, placeholder] of Object.entries(fieldMapping)) {
                    if (textContent.includes(literal)) {
                        textContent = textContent.replace(literal, placeholder);
                    }
                }

                const safeText = textContent
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');

                html += `    <div class="text-element" style="left: ${item.x}pt; top: ${item.y}pt; font-size: ${item.fontSize}pt; font-family: ${item.fontFamily}, sans-serif;">${safeText}</div>\n`;
            }

            html += `  </div>\n`;
        }

        html += `</div>
</body>
</html>`;

        return html;
    }
}

export const htmlGeneratorService = new HtmlGeneratorService();
