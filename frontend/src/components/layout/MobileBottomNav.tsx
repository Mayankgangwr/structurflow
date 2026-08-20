import React from "react";
import { Plus, Home, FileText, ClipboardCheck, BarChart2 } from "lucide-react";

const MobileBottomNav: React.FC = () => {
    return (
        <nav className="fixed bottom-0 w-full z-50 xs:hidden border-t border-border-subtle dark:border-outline-variant bg-surface dark:bg-inverse-surface shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
            {/* FAB Upload Button centered above nav */}
            <div className="absolute left-1/2 -top-6 transform -translate-x-1/2 z-50">
                <button className="bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95">
                    <Plus className="w-7 h-7" />
                </button>
            </div>
            <div className="flex justify-around items-center h-16 px-2">
                {/* Home (Active) */}
                <button className="flex flex-col items-center justify-center text-primary dark:text-inverse-primary font-bold scale-95 transition-transform duration-100 w-16 h-full pt-1">
                    <Home className="w-6 h-6 mb-1" />
                    <span className="font-label-sm text-[10px]">Home</span>
                </button>
                {/* Documents */}
                <button className="flex flex-col items-center justify-center text-secondary dark:text-secondary-fixed-dim active:bg-surface-container-high transition-colors duration-100 rounded-lg w-16 h-[52px] pt-1">
                    <FileText className="w-6 h-6 mb-1" />
                    <span className="font-label-sm text-[10px]">Documents</span>
                </button>
                {/* Spacer for FAB */}
                <div className="w-16"></div>
                {/* Verify */}
                <button className="flex flex-col items-center justify-center text-secondary dark:text-secondary-fixed-dim active:bg-surface-container-high transition-colors duration-100 rounded-lg w-16 h-[52px] pt-1">
                    <ClipboardCheck className="w-6 h-6 mb-1" />
                    <span className="font-label-sm text-[10px]">Verify</span>
                </button>
                {/* Analytics */}
                <button className="flex flex-col items-center justify-center text-secondary dark:text-secondary-fixed-dim active:bg-surface-container-high transition-colors duration-100 rounded-lg w-16 h-[52px] pt-1">
                    <BarChart2 className="w-6 h-6 mb-1" />
                    <span className="font-label-sm text-[10px]">Analytics</span>
                </button>
            </div>
        </nav>
    )
}

export default MobileBottomNav;