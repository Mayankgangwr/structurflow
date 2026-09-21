"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, AlertTriangle } from "lucide-react";
import { useLogoutMutation } from "@/features/auth/authApi";
import { logoutUser } from "@/features/auth/authSlice";
import { baseApi } from "@/services/baseApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogoutConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LogoutConfirmationDialog: React.FC<LogoutConfirmationDialogProps> = ({
    isOpen,
    onClose,
}) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { role } = usePermissions();
    const user = useAppSelector((state) => state.auth.user);
    const [logoutMutation, { isLoading }] = useLogoutMutation();

    if (!isOpen) return null;

    const fullName = user?.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : "Workspace User";
    const email = user?.email || "";
    const initials = user?.firstName
        ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
        : "S";

    const handleConfirmLogout = async () => {
        try {
            await logoutMutation({}).unwrap();
        } catch (error) {
            // Even if network or backend fails, proceed with client cleanup
            console.error("Logout request failed:", error);
        } finally {
            dispatch(logoutUser());
            dispatch(baseApi.util.resetApiState());
            toast.success("Logged out successfully");
            onClose();
            router.push("/login");
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            showCloseButton={!isLoading}
            size="sm"
            className="sm:max-w-md"
            footer={
                <div className="flex items-center justify-end gap-2.5 w-full">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-xs font-semibold px-4 h-9 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirmLogout}
                        disabled={isLoading}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 h-9 shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Logging out...</span>
                            </>
                        ) : (
                            <>
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Log Out</span>
                            </>
                        )}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                {/* Header Icon + Title */}
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                        <LogOut className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-bold text-slate-900 leading-tight">
                            Sign out of StructurFlow?
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                            Are you sure you want to end your current session? Any unsaved changes in the verification workbench will be discarded.
                        </p>
                    </div>
                </div>

                {/* Current Active Account Preview */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/80">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-xs font-semibold text-slate-900">
                                {fullName}
                            </p>
                            {role && (
                                <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0",
                                    role === "OWNER" && "bg-amber-50 text-amber-700 border-amber-200",
                                    role === "ADMIN" && "bg-blue-50 text-blue-700 border-blue-200",
                                    role === "REVIEWER" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                    role === "VIEWER" && "bg-slate-100 text-slate-600 border-slate-200"
                                )}>
                                    {role}
                                </span>
                            )}
                        </div>
                        <p className="truncate text-[11px] text-slate-500">
                            {email}
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default LogoutConfirmationDialog;
