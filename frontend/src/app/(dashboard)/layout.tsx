import React from "react";
import AuthGuard from "@/features/auth/components/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="w-full flex min-h-screen bg-surface-container-lowest">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
                {/* Header Placeholder */}
                <Topbar />
                {/* Page Content */}
                <div className="flex-1 overflow-y-auto bg-surface-bright pb-16 xs:pb-0 flex flex-col">
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </div>
                <MobileBottomNav />
            </main>
        </div>
    );
}

export default DashboardLayout;