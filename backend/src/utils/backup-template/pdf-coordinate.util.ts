export function convertPdfPoint(
    viewport: any,
    x: number,
    y: number
) {
    const [
        convertedX,
        convertedY
    ] = viewport.convertToViewportPoint(
        x,
        y
    );

    return {
        x: convertedX,
        y: convertedY,
    };
}