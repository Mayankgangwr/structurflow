import React from "react";
import { LayoutDashboard, FileText, UploadCloud, ClipboardCheck, Download, BarChart2, Settings, CircleHelp } from "lucide-react";
import { Button } from "../ui/button";

interface SidebarProps {
    children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
    return (
        <div className="h-screen w-full bg-surface px-2.5 py-1.5 flex flex-col sticky top-0">
            <div className="mb-md flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary font-bold text-on-primary">
                    S
                </div>

                <div>
                    <h1 className="font-headline-md text-base font-bold leading-tight text-primary">
                        StructurFlow
                    </h1>
                    <p className="font-label-sm text-[11px] leading-tight text-secondary">
                        Enterprise Workspace
                    </p>
                </div>
            </div>
            <Button className="w-full bg-primary !text-white hover:!text-white rounded-md py-2 px-4 mb-md font-label-md text-label-md hover:bg-primary-container transition-colors">
                New Project
            </Button>
            <div className="flex h-full w-full flex-col items-start justify-between">
                {/* Top Navigation */}
                <nav className="space-y-0.5 w-full">
                    <a className="group w-full flex items-center gap-3 rounded-md bg-surface-container-low px-2 py-1.5 font-label-md text-label-md font-bold text-primary"
                        href="#">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </a>

                    <a className="flex items-center gap-3 rounded-md px-2 py-1.5 font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary"
                        href="#">
                        <FileText className="h-4 w-4" />
                        Documents
                    </a>

                    <a className="flex items-center gap-3 rounded-md px-2 py-1.5 font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary"
                        href="#">
                        <UploadCloud className="h-4 w-4" />
                        Upload
                    </a>

                    <a className="flex items-center gap-3 rounded-md px-2 py-1.5 font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary"
                        href="#">
                        <ClipboardCheck className="h-4 w-4" />
                        Verification
                    </a>

                    <a className="flex items-center gap-3 rounded-md px-2 py-1.5 font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary"
                        href="#">
                        <Download className="h-4 w-4" />
                        Exports
                    </a>

                    <a className="flex items-center gap-3 rounded-md px-2 py-1.5 font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary"
                        href="#">
                        <BarChart2 className="h-4 w-4" />
                        Analytics
                    </a>
                </nav>

                {/* Bottom Navigation */}
                <div className="mt-auto space-y-0.5 border-t border-border-subtle pt-1 w-full">
                    {/* Settings */}
                    <a className="flex items-center gap-3 rounded-md px-2 py-1.5 font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary"
                        href="#">
                        <Settings className="h-4 w-4" />
                        Settings
                    </a>

                    {/* Support */}
                    <a className="flex items-center gap-3 rounded-md px-2 py-1.5 font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary"
                        href="#">
                        <CircleHelp className="h-4 w-4" />
                        Support
                    </a>

                    {/* User Profile */}
                    <div className="mt-1 flex items-center gap-3 px-2 py-1.5 bg-surface-container-lowest ">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary-container">
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuASdH4naDqi6HA53auxaqJXVZoJzasRHECb8CtGBK1hhn3BSC8ugLJDBcE3XAKEpV5sPfXhmebCDDT3kkyPOdtqfM1tWpn7TCsQ71kVCkfFwWWVni7terzmRiriisqL6evXO3cPdpuU3Y-WF9Aeq3EoExLFpDO_bp4uKwbKkwJ7g2NxsmHonnfpE-6dZYSB0FngfQAm38qnTVsMLVt69olPALjhhjM_F1Q6LzB3Z6kgPx0VJHwj5um7"
                                alt="User Profile Avatar"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate font-label-md text-label-md text-text-primary">
                                Alex Mercer
                            </p>

                            <p className="truncate text-[10px] text-secondary">
                                alex@structurflow.io
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );
};

export default Sidebar;
