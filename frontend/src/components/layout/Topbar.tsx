import React from "react";
import { Search, Bell } from "lucide-react";
import { Input } from "../ui/input";

const Topbar: React.FC = () => {
    return (
        <header className="hidden lg:flex justify-between items-center h-13 px-4 w-full bg-surface sticky top-0 z-30 shrink-0">
            <div className="flex-1 min-w-0">
                <h2 className="font-headline-md text-base font-bold text-text-primary truncate">Dashboard</h2>
                <p className="text-label-sm font-label-sm text-secondary truncate">Overview of your document processing activity</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative block w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                    <Input className="w-full pl-10 pr-4 py-2 bg-surface rounded-md border border-border-subtle text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" placeholder="Search documents..." type="text" />
                </div>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low transition-colors">
                    <Bell className="w-5 h-5" />
                </button>
                <button className="bg-primary text-on-primary rounded-md py-2 px-4 font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm">
                    Upload Documents
                </button>
            </div>
        </header>
    )
}

export default Topbar;