import React from "react";
import AuthGuard from "@/features/auth/components/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="w-full flex min-h-screen bg-surface-container-lowest">
            {/* Sidebar Placeholder */}
            <div className="w-[20%] max-w-56 min-w-48 bg-surface relative">
                <Sidebar children={undefined} />
            </div>

            {/* Main Content */}
            <main className="w-[80%] flex-1 flex flex-col min-h-screen relative overflow-hidden">
                {/* Header Placeholder */}
                <Topbar />
                {/* Page Content */}
                <div className="flex-1 overflow-auto bg-surface-bright">
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </div>
            </main>
        </div>
    );
}

export default DashboardLayout;