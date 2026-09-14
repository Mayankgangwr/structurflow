export interface FaqItem {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

export const faqs: FaqItem[] = [
    {
        id: "faq-1",
        category: "Ingestion",
        question: "What file formats are supported for document ingestion?",
        answer: "StructurFlow natively supports PDF documents (.pdf) up to 10MB as well as high-resolution images (.png, .jpeg, .jpg). Multi-page PDFs are automatically parsed and transcribed into clean structured layouts.",
    },
    {
        id: "faq-2",
        category: "AI Extraction",
        question: "How does AI information extraction work?",
        answer: "Our pipeline uses multimodal Gemini 2.5/3.5 Flash models to inspect raw document layouts alongside your project's active template schema. The AI transcribes and maps visual fields into strict JSON objects conforming directly to your field constraints.",
    },
    {
        id: "faq-3",
        category: "Verification",
        question: "How do I correct an AI hallucination or mistake?",
        answer: "Open any document from the Verification Queue in the Verification Workbench. The right-hand pane allows auditors to directly edit any field value inline. When approved, the system generates the final verified PDF using your human corrections.",
    },
    {
        id: "faq-4",
        category: "Permissions & Security",
        question: "How do role-based permissions work in StructurFlow?",
        answer: "StructurFlow uses 4 role tiers: OWNER (full administrative power), ADMIN (project & template management, invites), REVIEWER (verification, rejection, and transformation), and VIEWER (read-only document exports).",
    },
    {
        id: "faq-5",
        category: "Templates",
        question: "Can I re-process a document if the template schema changes?",
        answer: "Yes! In the Verification Workbench, click 'Re-process' to re-run the AI extraction pipeline with the latest active project template schema without having to re-upload the original document.",
    },
];
