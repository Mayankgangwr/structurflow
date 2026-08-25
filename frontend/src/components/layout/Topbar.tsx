"use client"

import React, { useState } from "react";
import { Search, Bell, Network, Plus } from "lucide-react";
import { Input } from "../ui/input";
import { usePathname } from "next/navigation";
import { getPageDetails } from "@/lib/utils";
import { Button } from "../ui/button";
import ProjectForm from "@/features/projects/components/ProjectForm";

const Topbar: React.FC = () => {
    const pathname = usePathname() || "";
    const { title, description } = getPageDetails(pathname);
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

    return (
        <>
            {/* Desktop/Tablet Topbar - visible at ≥450px */}
            <header className="hidden xs:flex justify-between items-center h-13 px-4 w-full bg-surface sticky top-0 z-30 shrink-0">
                <div className="flex-1 min-w-0">
                    <h2 className="font-headline-md text-base font-bold text-text-primary truncate">{title}</h2>
                    <p className="text-label-sm font-label-sm text-secondary truncate">{description}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                        <Input className="w-full pl-10 pr-4 py-2 bg-surface rounded-md border border-border-subtle text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" placeholder="Search documents..." type="text" />
                    </div>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>

                    <Button
                        className={`bg-primary !text-white hover:!text-white mb-0 font-label-md hover:bg-primary-container transition-colors shrink-0 rounded-md py-2 px-4 text-label-md`}
                        title={"New Project"}
                        onClick={() => setIsProjectFormOpen(true)}
                    >
                        {"New Project"}
                    </Button>
                </div>
            </header>
            <ProjectForm isOpen={isProjectFormOpen} onClose={() => setIsProjectFormOpen(false)} />

            {/* Mobile Topbar - visible below 450px */}
            <div className="h-16 w-full xs:hidden shrink-0" />
            <header className="fixed top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-subtle h-16 flex justify-between items-center px-4 w-full xs:hidden shrink-0">
                <div className="flex items-center gap-2">
                    <Network className="text-primary w-6 h-6" />
                    <span className="font-headline-md text-headline-md font-bold text-primary">StructurFlow</span>
                </div>
                <div className="flex items-center gap-3">
                    <button className="relative p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200">
                        <Bell className="w-5 h-5 text-secondary" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border border-surface"></span>
                    </button>
                    <img alt="User Profile Avatar" className="w-8 h-8 rounded-full object-cover border border-border-subtle" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQbJFY-lh9RENbhCapFpbmRrQn996Xn9g4sKX8koUBFGM_G9ZMdByqJgge8KpTDMV1ckbKLjIwAMh8C4zzU_XnQSoMyzfiJZ7H--_prgslz9DMZON2pyENmoCfq6zrd7uAMILS-fBTU8fNuokKTqhRcHK2niAsNoTL8whX_Yhq8Te_8d8OgJoKWYioqH_r99oFfrj9h8bkoBrDrQRE0Q0Ot9rLSAnCDE8a6eP-NS1Jn-VOO2hdWz3l" />
                </div>
            </header>
        </>
    )
}
export default Topbar;