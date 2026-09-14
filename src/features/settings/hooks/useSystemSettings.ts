"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export const useSystemSettings = () => {
    const [confidenceThreshold, setConfidenceThreshold] = useState(85);
    const [autoFlagLowConfidence, setAutoFlagLowConfidence] = useState(true);
    const [strictSchemaValidation, setStrictSchemaValidation] = useState(true);
    const [cacheTtlMinutes, setCacheTtlMinutes] = useState(60);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveThresholds = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Extraction & verification thresholds updated");
        }, 300);
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
        isSaving,
        handleSaveThresholds,
    };
};
