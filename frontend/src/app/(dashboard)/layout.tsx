import React from "react";
import AuthGuard from "@/features/auth/components/AuthGuard";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:block">
                <div className="h-16 flex px-4 items-center border-b border-slate-200">
                    <h1 className="font-bold text-xl text-blue-600">
                        StructurFlow
                    </h1>
                </div>
                <nav className="space-y-2">
                    {/* Navigation items will go here */}
                    <div className="px-4 py-4 rounded-0 bg-blue-50 text-blue-700 font-medium text-xl">
                        Dashboard
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header Placeholder */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
                    <div className="ml-auto">
                        {/* User profile / actions will go here */}
                        <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 flex-1 overflow-auto">
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </div>
            </main>
        </div>
    );
}

export default DashboardLayout;