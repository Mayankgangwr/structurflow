import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { gemini } from "@/config/gemini";
import generatePdfFromTemplate, { PdfTextElement, GeneratePdfOptions } from "@/utils/generatePdfFromTemplate";

const execFileAsync = promisify(execFile);

class PdfService {
    private readonly dockerImage = "dalbano/pdf2htmlex:latest";

    async convertPdfToHtml(pdfPath: string): Promise<string> {
        const tempId = crypto.randomUUID();

        const tempDir = path.join(
            os.tmpdir(),
            "structurflow",
            tempId
        );

        await fs.mkdir(tempDir, {
            recursive: true,
        });

        try {
            const cleanPath = pdfPath.split('?')[0];
            const pdfFileName = path.basename(cleanPath) || 'input.pdf';

            const tempPdfPath = path.join(
                tempDir,
                pdfFileName
            );

            const htmlFileName = "template.html";

            const htmlPath = path.join(
                tempDir,
                htmlFileName
            );

            // Copy or download PDF to temporary directory
            if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
                const response = await fetch(pdfPath);
                if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                await fs.writeFile(tempPdfPath, Buffer.from(await response.arrayBuffer()));
            } else {
                await fs.copyFile(pdfPath, tempPdfPath);
            }

            // Run pdf2htmlEX through Docker
            await execFileAsync("docker", [
                "run",
                "--rm",

                "-v",
                `${tempDir}:/pdf`,

                "-w",
                "/pdf",

                this.dockerImage,

                "pdf2htmlEX",

                pdfFileName,
                htmlFileName,
            ]);

            // Read generated HTML as string
            const html = await fs.readFile(
                htmlPath,
                "utf-8"
            );

            return html;

        } finally {
            // Remove temporary files
            await fs.rm(tempDir, {
                recursive: true,
                force: true,
            });
        }
    }

    /**
     * Extracts plain text from a PDF file
     * @param pdfSource Local file path, HTTP URL, or a raw Buffer
     * @returns The extracted text content
     */
    async extractTextFromPdf(pdfSource: string | Buffer): Promise<string> {
        try {
            let buffer: Buffer;
            if (Buffer.isBuffer(pdfSource)) {
                buffer = pdfSource;
            } else if (pdfSource.startsWith('http://') || pdfSource.startsWith('https://')) {
                const res = await fetch(pdfSource);
                if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
                const arrayBuffer = await res.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
            } else {
                buffer = await fs.readFile(pdfSource);
            }

            const pdf = await pdfjsLib.getDocument({
                data: new Uint8Array(buffer),
                useSystemFonts: true,
            }).promise;

            const textChunks: string[] = [];
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .filter((item: any) => "str" in item)
                    .map((item: any) => item.str)
                    .join(" ");
                if (pageText.trim()) {
                    textChunks.push(pageText.trim());
                }
            }

            return textChunks.join("\n\n");
        } catch (error: any) {
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }

    async processPdfWithSchema(extractedData: string | Record<string, any>[], schema: object) {
        try {
            const dataString = typeof extractedData === 'string' ? extractedData : JSON.stringify(extractedData);
            const schemaString = JSON.stringify(schema, null, 2);

            const prompt = `You are an expert data extraction AI. Your task is to extract information from the provided document text according to the exact JSON schema provided.

DOCUMENT TEXT:
${dataString}

EXPECTED SCHEMA:
${schemaString}

Instructions:
1. Extract the required fields from the document text.
2. Return ONLY a raw, valid JSON object matching the schema.
3. Do NOT include markdown blocks like \`\`\`json.
4. If a field cannot be found, use null or an empty string as appropriate.
`;

            const response = await gemini.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            const responseText = response.text?.trim() || "{}";

            let cleanJson = responseText;
            if (cleanJson.startsWith('\`\`\`json')) {
                cleanJson = cleanJson.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
            } else if (cleanJson.startsWith('\`\`\`')) {
                cleanJson = cleanJson.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
            }

            const parsedData = JSON.parse(cleanJson);

            return {
                data: parsedData,
                parsingIssues: []
            };
        } catch (error: any) {
            throw new Error(`Failed to process PDF with schema: ${error.message}`);
        }
    }

    /**
     * Generates a populated PDF using extracted template elements and actual data JSON.
     */
    async generatePdfFromTemplate(
        templateElements: PdfTextElement[],
        data: Record<string, any>,
        options?: GeneratePdfOptions
    ): Promise<Buffer> {
        return await generatePdfFromTemplate(templateElements, data, options);
    }
}

const pdfService = new PdfService();

export default pdfService;