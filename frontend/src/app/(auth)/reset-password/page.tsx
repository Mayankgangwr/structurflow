import React, { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

const ResetPasswordPage: React.FC = () => {
    return (
        <Suspense fallback={<div className="flex justify-center p-4">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
};

export default ResetPasswordPage;
