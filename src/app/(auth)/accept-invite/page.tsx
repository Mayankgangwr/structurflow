import { AcceptInviteForm } from "@/features/auth/components/AcceptInviteForm";
import React, { Suspense } from "react";

const AcceptInvitePage: React.FC = () => {
    return (
        <Suspense fallback={<div className="p-8 text-center text-secondary">Loading invitation...</div>}>
            <AcceptInviteForm />
        </Suspense>
    );
};

export default AcceptInvitePage;
