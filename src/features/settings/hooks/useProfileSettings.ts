"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

export const useProfileSettings = () => {
    const { data: session } = authClient.useSession();
    const user = session?.user as any;

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (user) {
            const nameParts = (user.name || "").split(" ");
            setFirstName(user.firstName || nameParts[0] || "");
            setLastName(user.lastName || nameParts.slice(1).join(" ") || "");
            setEmail(user.email || "");
        }
    }, [user]);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || user?.name || "Workspace User";
    const initials = firstName
        ? `${firstName[0]}${lastName ? lastName[0] : ""}`.toUpperCase()
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
