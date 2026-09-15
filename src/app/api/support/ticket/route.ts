import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { supportService, SupportServiceError } from "@/lib/services/support.service";
import { createSupportTicketSchema } from "@/lib/validations/support";
import { z } from "zod";

export async function POST(req: NextRequest) {
    try {
        const { user, organizationId } = await getAuthenticatedUserAndOrg(req);

        const body = await req.json();
        const validatedData = createSupportTicketSchema.parse(body);

        const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
        const userAgent = req.headers.get("user-agent");

        const result = await supportService.createTicket({
            userId: user.id,
            userEmail: user.email,
            userName: user.name || "Customer",
            organizationId,
            data: validatedData,
            ipAddress,
            userAgent,
        });

        return NextResponse.json(
            {
                success: true,
                message: `Support ticket #${result.ticketId} created successfully`,
                data: result,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid ticket submission data",
                    errors: error.issues,
                },
                { status: 400 }
            );
        }

        if (error instanceof SupportServiceError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.message,
                    code: error.code,
                },
                { status: error.statusCode }
            );
        }

        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json(
                { success: false, message: "Unauthorized", errors: [] },
                { status: 401 }
            );
        }

        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json(
                { success: false, message: "No active organization found", errors: [] },
                { status: 400 }
            );
        }

        console.error("[POST /api/support/ticket error]:", error);
        return NextResponse.json(
            {
                success: false,
                message: "An internal error occurred while submitting your ticket",
                errors: [],
            },
            { status: 500 }
        );
    }
}
