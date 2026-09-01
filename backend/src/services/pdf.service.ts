import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

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
}

const pdfService = new PdfService();

export default pdfService;