"use client";

import { useState, useEffect } from "react";
import {
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
} from "../settingsApi";
import toast from "react-hot-toast";

export const useSystemSettings = () => {
    const { data: systemRes, isLoading: isLoadingSystem } = useGetSystemSettingsQuery();
    const [updateSystemSettings, { isLoading: isSaving }] = useUpdateSystemSettingsMutation();

    const thresholds = systemRes?.data?.thresholds;
    const infrastructure = systemRes?.data?.infrastructure;

    const [confidenceThreshold, setConfidenceThreshold] = useState(85);
    const [autoFlagLowConfidence, setAutoFlagLowConfidence] = useState(true);
    const [strictSchemaValidation, setStrictSchemaValidation] = useState(true);
    const [cacheTtlMinutes, setCacheTtlMinutes] = useState(60);

    useEffect(() => {
        if (thresholds) {
            setConfidenceThreshold(thresholds.confidenceThreshold ?? 85);
            setAutoFlagLowConfidence(thresholds.autoFlagLowConfidence ?? true);
            setStrictSchemaValidation(thresholds.strictSchemaValidation ?? true);
            setCacheTtlMinutes(thresholds.cacheTtlMinutes ?? 60);
        }
    }, [thresholds]);

    const handleSaveThresholds = async () => {
        try {
            await updateSystemSettings({
                confidenceThreshold,
                autoFlagLowConfidence,
                strictSchemaValidation,
                cacheTtlMinutes,
            }).unwrap();
            toast.success("Extraction & verification thresholds updated");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update system thresholds");
        }
    };

    return {
        confidenceThreshold,
        setConfidenceThreshold,
        autoFlagLowConfidence,
        setAutoFlagLowConfidence,
        strictSchemaValidation,
        setStrictSchemaValidation,
        cacheTtlMinutes,
        setCacheTtlMinutes,
        infrastructure,
        isLoadingSystem,
        isSaving,
        handleSaveThresholds,
    };
};
