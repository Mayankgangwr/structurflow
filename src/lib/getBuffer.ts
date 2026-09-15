export default async function getPdfBufferFromUrl(pdfUrl: string): Promise<Buffer> {
    if (!pdfUrl || typeof pdfUrl !== "string" || !pdfUrl.trim().startsWith("http")) {
        throw new Error(`Invalid PDF URL provided: "${pdfUrl}"`);
    }
    const response = await fetch(pdfUrl.trim());

    if (!response.ok) {
        throw new Error(
            `Failed to fetch PDF: ${response.status} ${response.statusText}`
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
}