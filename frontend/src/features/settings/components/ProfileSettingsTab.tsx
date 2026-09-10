"use client";

import React from "react";
import { User, Lock, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileSettings } from "../hooks/useProfileSettings";

export const ProfileSettingsTab: React.FC = () => {
    const {
        fullName,
        initials,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email,
        currentPassword,
        setCurrentPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        isSavingProfile,
        isChangingPassword,
        handleSaveProfile,
        handleChangePassword,
    } = useProfileSettings();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Personal Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                        <p className="text-xs text-slate-500">Update your public profile and workspace identity</p>
                    </div>
                </div>

                <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                    <div className="flex items-center gap-4 pb-2">
                        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                            {initials}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                            <p className="text-xs text-slate-500">{email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="First Name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Email Address</label>
                        <input
                            type="email"
                            disabled
                            value={email}
                            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-[11px] text-slate-400">Email address is permanently associated with your authentication account.</p>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSavingProfile}
                            className="text-xs sm:text-sm font-semibold gap-1.5 py-2 px-4 cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Change Password Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Security & Password</h2>
                        <p className="text-xs text-slate-500">Ensure your account is using a secure, complex password</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
                        <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Passwords must be at least 8 characters and include uppercase, lowercase, number, and special character.</span>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isChangingPassword}
                            variant="default"
                            className="text-xs sm:text-sm font-semibold gap-1.5 py-2 px-4 cursor-pointer"
                        >
                            <Lock className="w-4 h-4" />
                            <span>{isChangingPassword ? "Updating..." : "Update Password"}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettingsTab;
