export default async function getPdfBufferFromUrl(pdfUrl: string): Promise<Buffer> {
    const response = await fetch(pdfUrl);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch PDF: ${response.status} ${response.statusText}`
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
}