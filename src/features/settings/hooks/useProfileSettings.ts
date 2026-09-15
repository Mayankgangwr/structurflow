"use client";

import { useState, useEffect } from "react";
import {
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
} from "../settingsApi";
import toast from "react-hot-toast";

export const useProfileSettings = () => {
    const { data: profileRes, isLoading: isLoadingProfile } = useGetProfileQuery();
    const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

    const profile = profileRes?.data;

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName || "");
            setLastName(profile.lastName || "");
            setEmail(profile.email || "");
        }
    }, [profile]);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const fullName =
        `${firstName || ""} ${lastName || ""}`.trim() || profile?.name || "Workspace User";
    const initials = firstName
        ? `${firstName[0]}${lastName ? lastName[0] : ""}`.toUpperCase()
        : "S";

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) {
            toast.error("First and last name are required");
            return;
        }

        try {
            await updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            }).unwrap();
            toast.success("Profile preferences saved successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to save profile preferences");
        }
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
        if (
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword) ||
            !/[^A-Za-z0-9]/.test(newPassword)
        ) {
            toast.error(
                "Password must include uppercase, lowercase, number, and special character"
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        try {
            await changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            }).unwrap();
            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update password");
        }
    };

    return {
        user: profile,
        isLoadingProfile,
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
