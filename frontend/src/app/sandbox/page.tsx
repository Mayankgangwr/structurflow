import { Metadata } from "next";
import SandboxWorkspace from "@/features/sandbox/components/SandboxWorkspace";

export const metadata: Metadata = {
    title: "Instant Guest Sandbox | StructurFlow",
    description: "Transform raw documents directly into structured PDF templates without logging in. 100% ephemeral in-memory processing with zero database storage.",
};

export default function SandboxPage() {
    return <SandboxWorkspace />;
}
