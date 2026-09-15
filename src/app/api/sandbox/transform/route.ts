import { NextRequest, NextResponse } from "next/server";
import { sandboxService, SandboxServiceError } from "@/lib/services/sandbox.service";
import {
    SANDBOX_MAX_FILE_SIZE,
    SANDBOX_ALLOWED_DOCUMENT_TYPES,
    SANDBOX_ALLOWED_TEMPLATE_TYPES,
} from "@/lib/validations/sandbox";

// In-memory rate limiting map: IP -> timestamp array
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];

    // Filter timestamps within the current window
    const activeTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    activeTimestamps.push(now);
    rateLimitMap.set(ip, activeTimestamps);
    return true;
}

export async function POST(req: NextRequest) {
    try {
        // 1. IP-based rate limiting for public guest usage
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
        if (!checkRateLimit(clientIp)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Guest sandbox limit reached (10 transformations per 15 mins). Please wait or create a free workspace for unlimited processing.",
                    errors: [],
                },
                { status: 429 }
            );
        }

        // 2. Validate Content-Type
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Content-Type must be multipart/form-data with file attachments.",
                    errors: [],
                },
                { status: 400 }
            );
        }

        // 3. Parse multipart form data
        const formData = await req.formData();
        const templateFile = formData.get("template") as File | null;
        const documentFile = formData.get("document") as File | null;

        if (!templateFile) {
            return NextResponse.json(
                {
                    success: false,
                    message: "A target template PDF file is required for transformation.",
                    errors: [],
                },
                { status: 400 }
            );
        }

        if (!documentFile) {
            return NextResponse.json(
                {
                    success: false,
                    message: "A raw document file (PDF, PNG, or JPEG) is required for transformation.",
                    errors: [],
                },
                { status: 400 }
            );
        }

        // 3. File size validations
        if (templateFile.size > SANDBOX_MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Template file size exceeds maximum limit of 10 MB.",
                    errors: [],
                },
                { status: 400 }
            );
        }

        if (documentFile.size > SANDBOX_MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Document file size exceeds maximum limit of 10 MB.",
                    errors: [],
                },
                { status: 400 }
            );
        }

        // 4. File MIME type validations
        const templateMime = templateFile.type || "application/pdf";
        const documentMime = documentFile.type || "application/pdf";

        const isTemplatePdf =
            SANDBOX_ALLOWED_TEMPLATE_TYPES.includes(templateMime) ||
            templateFile.name.toLowerCase().endsWith(".pdf");

        if (!isTemplatePdf) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Templates must be in PDF format with structured text layout.",
                    errors: [],
                },
                { status: 400 }
            );
        }

        const isDocAllowed =
            SANDBOX_ALLOWED_DOCUMENT_TYPES.includes(documentMime) ||
            documentFile.name.toLowerCase().endsWith(".pdf") ||
            documentFile.name.toLowerCase().endsWith(".png") ||
            documentFile.name.toLowerCase().endsWith(".jpg") ||
            documentFile.name.toLowerCase().endsWith(".jpeg") ||
            documentFile.name.toLowerCase().endsWith(".webp");

        if (!isDocAllowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid document type. Please upload a PDF or an image file (PNG, JPEG, WEBP).",
                    errors: [],
                },
                { status: 400 }
            );
        }

        // 5. Convert files to in-memory buffers
        const templateBuffer = Buffer.from(await templateFile.arrayBuffer());
        const rawDocumentBuffer = Buffer.from(await documentFile.arrayBuffer());

        // 6. Execute ephemeral transformation in volatile RAM
        const result = await sandboxService.transformEphemeral({
            templateBuffer,
            templateMimeType: templateMime,
            templateName: templateFile.name,
            rawDocumentBuffer,
            rawDocumentMimeType: documentMime,
            rawDocumentName: documentFile.name,
        });

        return NextResponse.json({
            success: true,
            message: "Document transformed successfully in ephemeral sandbox",
            data: result,
        });
    } catch (error: unknown) {
        if (error instanceof SandboxServiceError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.message,
                    errors: [],
                },
                { status: error.statusCode }
            );
        }

        console.error("[POST /api/sandbox/transform error]:", error);
        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "An internal server error occurred while processing document transformation.",
                errors: [],
            },
            { status: 500 }
        );
    }
}
