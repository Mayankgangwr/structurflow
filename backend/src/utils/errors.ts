/**
 * Base class for all domain/business errors.
 * The global error handler know how to map each subclass to an HTTP status code.
 */

export class DomainError extends Error {
    details: Array<{ field?: string; code: string; message: string }>;
    data?: any;

    constructor(
        message: string,
        details: Array<{ field?: string; code: string; message: string }>,
        data?: any
    ) {
        super(message);
        this.name = this.constructor.name,
            this.details = details;
        this.data = data;
    }
}

// --- Error subclasses (each maps to an HTTP status code in 
// error.middleware.ts) ---
export class BadRequestError extends DomainError { } // 400
export class EntityNotFoundError extends DomainError { }   // 404
export class UnauthorizedError extends DomainError { }     // 401
export class ForbiddenError extends DomainError { }        // 403
export class ValidationError extends DomainError { }       // 400
export class ConflictError extends DomainError { }         // 409
export class InternalError extends DomainError { }         // 500
export class TooManyRequestsError extends DomainError { }  // 429
/**
 * Centralized error factory.
 * Every throwable error in the entire app is defined here.
 * Services throw these. the global error handler catches them.
 */

export const ApiErrors = {
    // --- Auth & Identity ---
    unauthorized: () => new UnauthorizedError('Unauthorized', [{ code: "UNAUTHORIZED", message: "You are not authorized to perform this action." }]),
    invalidCredentials: () => new UnauthorizedError('Invalid credentials', [{ code: 'INVALID_CREDENTIALS', message: 'The email or password provided is incorrect.' }]),
    invalidToken: () => new UnauthorizedError('Invalid or expired token', [{ code: 'INVALID_TOKEN', message: 'The token is invalid or has expired.' }]),
    invalidResetToken: () => new UnauthorizedError('Reset token is invalid or expired', [{ code: 'INVALID_RESET_TOKEN', message: 'The password reset token is invalid or has expired.' }]),
    emailAlreadyExists: () => new ConflictError('Email already in use', [{ code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' }]),
    registrationFailed: () => new InternalError('Registration failed', [{ code: 'REGISTRATION_FAILED', message: 'An error occurred during registration.' }]),

    // --- Users ---
    userNotFound: () => new EntityNotFoundError('User not found', [{ code: 'USER_NOT_FOUND', message: 'The requested user does not exist.' }]),

    // --- Organizations ---
    organizationNotFound: () => new EntityNotFoundError('Organization not found', [{ code: 'ORGANIZATION_NOT_FOUND', message: 'The requested organization does not exist.' }]),
    orgSlugTaken: () => new ConflictError('Organization slug already taken', [{ code: 'ORG_SLUG_TAKEN', message: 'An organization with this name already exists.' }]),

    // --- Membership & Permissions ---
    forbidden: (message = 'Forbidden') => new ForbiddenError(message, [{ code: 'FORBIDDEN', message }]),
    membershipNotFound: () => new ForbiddenError('No membership found', [{ code: 'MEMBERSHIP_NOT_FOUND', message: 'You do not belong to this organization.' }]),
    insufficientPermissions: () => new ForbiddenError('Insufficient permissions', [{ code: 'INSUFFICIENT_PERMISSIONS', message: 'Your role does not have permission for this action.' }]),

    // --- Invitation ---
    duplicateMembership: () => new ConflictError("User is already a member of this organization", [{ code: "ALREADY_MEMBER", message: "User is already a member of this organization" }]),
    invalidOrExpiredInvite: () => new BadRequestError("Invite link is invalid or has expired", [{ code: "INVALID_OR_EXPIRED_INVITE", message: "Invite link is invalid or has expired" }]),
    registrationDetailsRequired: () => new BadRequestError("Registration details are required for new users", [{ code: "REGISTRATION_DETAILS_REQUIRED", message: "Registration details are required for new users" }]),
    tooManyRequests: () => new TooManyRequestsError('Too many requests', [{ code: 'TOO_MANY_REQUESTS', message: 'Please wait 60 seconds before requesting a new OTP.' }]),

    // Add these inside your existing ApiErrors object:

    // --- Documents ---
    documentNotFound: () => new EntityNotFoundError('Document not found', [{ code: 'DOCUMENT_NOT_FOUND', message: 'The requested document does not exist in this organization.' }]),
    invalidFileType: (mimeType: string) => new ValidationError('Invalid file type', [{ code: 'INVALID_FILE_TYPE', message: `Files of type ${mimeType} are not supported. Please upload PDF, PNG, or JPEG.` }]),
    invalidDocumentType: () => new ValidationError('Invalid document type', [{ code: 'INVALID_DOCUMENT_TYPE', message: 'Invalid or missing documentType. Must be TEMPLATE or RAW.' }]),
    fileTooLarge: (maxSizeMB: number) => new ValidationError('File too large', [{ code: 'FILE_TOO_LARGE', message: `The uploaded file exceeds the maximum allowed size of ${maxSizeMB}MB.` }]),
    uploadFailed: () => new InternalError('File upload failed', [{ code: 'UPLOAD_FAILED', message: 'An error occurred while uploading the file to storage.' }]),

     // --- Projects ---
    //  prjectIdRequired: () => new ValidationError(),
    projectNotFound: () => new EntityNotFoundError('Project not found', [{ code: 'PROJECT_NOT_FOUND', message: 'The requested project does not exist.' }]),

    // --- Templates ---
    templateNotFound: () => new EntityNotFoundError('Template not found', [{ code: 'TEMPLATE_NOT_FOUND', message: 'The requested template does not exist or does not belong to this project.' }]),
    templateNoExtractableText: () => new ValidationError('Template PDF contains no extractable text', [{ code: 'TEMPLATE_NO_TEXT', message: 'The uploaded template PDF does not contain any extractable text. Please ensure the document is a text-searchable PDF and not an image-only scan.' }]),
    templateSchemaGenerationFailed: (message: string) => new InternalError('Failed to generate target schema', [{ code: 'TEMPLATE_SCHEMA_GENERATION_FAILED', message: `Failed to generate target schema: ${message}` }]),
    missingParsedTemplate: () => new ValidationError('Missing parsed template', [{ code: 'MISSING_PARSED_TEMPLATE', message: 'No parsed template was found for this project. Please upload and parse a template first.' }]),
    
    // --- LLM / External APIs ---
    geminiApiError: (status: number, message: string) => new InternalError('LLM API Error', [{ code: 'GEMINI_API_ERROR', message: `Gemini API error: ${status} — ${message}` }]),
    emptyLlmResponse: () => new InternalError('Empty LLM Response', [{ code: 'EMPTY_LLM_RESPONSE', message: 'The AI model returned an empty response.' }]),
    invalidLlmSchema: () => new ValidationError('Invalid LLM Schema', [{ code: 'INVALID_LLM_SCHEMA', message: 'The AI model returned an invalid schema structure.' }]),
    llmMappingFailed: (message: string) => new InternalError('LLM Mapping Failed', [{ code: 'LLM_MAPPING_FAILED', message: `LLM mapping failed: ${message}` }]),
    

    // --- Generic ---
    missingRequiredField: (field: string) => new ValidationError(`${field} is required`, [{ field, code: 'REQUIRED_FIELD', message: `${field} is required.` }]),
    orgIdRequired: () => new ValidationError('Organization ID is required', [{ code: 'ORG_ID_REQUIRED', message: 'The X-Organization-Id header or orgId parameter is required.' }]),


}