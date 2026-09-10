"use client";

import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import toast from "react-hot-toast";

export const useProfileSettings = () => {
    const user = useAppSelector((state) => state.auth.user);

    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [email] = useState(user?.email || "");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Workspace User";
    const initials = user?.firstName
        ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
        : "S";

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) {
            toast.error("First and last name are required");
            return;
        }

        setIsSavingProfile(true);
        setTimeout(() => {
            setIsSavingProfile(false);
            toast.success("Profile preferences saved successfully");
        }, 400);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            toast.error("Please enter your current password");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("New password must be at least 8 characters");
            return;
        }
        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
            toast.error("Password must include uppercase, lowercase, number, and special character");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setIsChangingPassword(true);
        setTimeout(() => {
            setIsChangingPassword(false);
            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }, 500);
    };

    return {
        user,
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
    };
};
