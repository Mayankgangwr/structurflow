"use client";

import React, { useRef, useEffect } from "react";
import {
    Search,
    X,
    Folder,
    FileText,
    ArrowRight,
    Loader2,
    CornerDownLeft,
    Sparkles,
    CheckCircle2,
    Clock,
    XCircle,
    User,
} from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import {
    useGlobalSearch,
    SearchResultItem,
    ProjectSearchItem,
    DocumentSearchItem,
    NavigationSearchItem,
    TeamMemberSearchItem,
} from "./useGlobalSearch";

interface GlobalSearchBarProps {
    className?: string;
    isMobile?: boolean;
    onCloseMobile?: () => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
    className,
    isMobile = false,
    onCloseMobile,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        query,
        setQuery,
        isOpen,
        setIsOpen,
        isSearching,
        selectedIndex,
        setSelectedIndex,
        matchingNavigation,
        matchingProjects,
        matchingDocuments,
        matchingTeamMembers,
        allResults,
        handleSelect,
        handleSubmitAllDocuments,
        handleKeyDown,
    } = useGlobalSearch();

    // Global keyboard shortcut: Ctrl+K / Cmd+K
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpen(true);
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [setIsOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsOpen]);

    const getDocStatusBadge = (status: string) => {
        switch (status) {
            case "VERIFIED":
            case "EXPORTED":
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Verified</span>
                    </span>
                );
            case "TRANSFORMED":
            case "REVIEW_REQUIRED":
            case "NEEDS_VERIFICATION":
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Needs Review</span>
                    </span>
                );
            case "PROCESSING":
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>Processing</span>
                    </span>
                );
            case "REJECTED":
            case "FAILED":
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        <XCircle className="w-2.5 h-2.5" />
                        <span>Rejected</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <span>Uploaded</span>
                    </span>
                );
        }
    };

    const onItemClick = (item: SearchResultItem) => {
        handleSelect(item);
        if (onCloseMobile) onCloseMobile();
    };

    const onSearchAllClick = () => {
        handleSubmitAllDocuments();
        if (onCloseMobile) onCloseMobile();
    };

    // Calculate item global index for keyboard focus
    let itemCounter = 0;

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {/* Search Input Bar */}
            <div className="relative flex items-center">
                <Search
                    onClick={() => {
                        inputRef.current?.focus();
                        setIsOpen(true);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4 cursor-pointer hover:text-primary transition-colors"
                />
                <Input
                    ref={inputRef}
                    autoFocus={isMobile}
                    className="w-full pl-9 pr-16 py-1.5 bg-surface rounded-md border border-border-subtle text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow text-xs"
                    placeholder="Search documents, projects, navigation... (Ctrl+K)"
                    type="text"
                    value={query}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                />

                {/* Right Input Badges / Clear Icon */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {isSearching && (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    )}
                    {query ? (
                        <button
                            onClick={() => {
                                setQuery("");
                                inputRef.current?.focus();
                            }}
                            className="text-secondary hover:text-text-primary p-0.5 rounded transition-colors"
                            title="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        !isMobile && (
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-secondary bg-surface-container-low border border-border-subtle rounded text-text-primary/70 pointer-events-none">
                                <span className="text-[11px]">⌘</span>K
                            </kbd>
                        )
                    )}
                    {isMobile && onCloseMobile && (
                        <button
                            onClick={onCloseMobile}
                            className="text-secondary hover:text-text-primary p-0.5 rounded transition-colors ml-1"
                            title="Close search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Instant Search Results Popover */}
            {isOpen && (
                <div
                    className={cn(
                        "bg-surface border border-border-subtle rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col",
                        isMobile
                            ? "fixed left-3 right-3 top-27 max-h-[75vh]"
                            : "absolute right-0 top-11 w-[320px] sm:w-[380px] md:w-[440px] max-w-[calc(100vw-2rem)] max-h-[480px]"
                    )}
                >
                    {/* Header summary when querying */}
                    {query.trim() && (
                        <div className="p-2.5 px-3.5 bg-surface-container-lowest border-b border-border-subtle flex items-center justify-between text-xs text-secondary">
                            <span className="truncate">
                                Results for <span className="font-semibold text-text-primary">"{query.trim()}"</span>
                            </span>
                            <span className="text-[11px] font-medium text-primary">
                                {allResults.length} {allResults.length === 1 ? "match" : "matches"}
                            </span>
                        </div>
                    )}

                    {/* Scrollable Results List */}
                    <div className="overflow-y-auto divide-y divide-border-subtle/50 flex-1 max-h-[380px]">
                        {/* SECTION 1: PROJECTS */}
                        {matchingProjects.length > 0 && (
                            <div className="p-2">
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                    <Folder className="w-3 h-3 text-primary" />
                                    <span>Projects ({matchingProjects.length})</span>
                                </div>
                                <div className="mt-1 space-y-0.5">
                                    {matchingProjects.map((project) => {
                                        const currentIndex = itemCounter++;
                                        const isSelected = selectedIndex === currentIndex;
                                        return (
                                            <div
                                                key={project.id}
                                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                                onClick={() => onItemClick(project)}
                                                className={cn(
                                                    "px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-left",
                                                    isSelected
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "hover:bg-surface-container-low text-text-primary"
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                                                        <Folder className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold truncate text-text-primary">
                                                            {project.name}
                                                        </p>
                                                        {project.description && (
                                                            <p className="text-[11px] text-secondary truncate">
                                                                {project.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] text-secondary bg-surface-container-low px-1.5 py-0.5 rounded border border-border-subtle">
                                                        {project.documentsCount} docs
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-secondary/70" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SECTION 2: DOCUMENTS */}
                        {matchingDocuments.length > 0 && (
                            <div className="p-2">
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                    <FileText className="w-3 h-3 text-primary" />
                                    <span>Documents ({matchingDocuments.length})</span>
                                </div>
                                <div className="mt-1 space-y-0.5">
                                    {matchingDocuments.map((doc) => {
                                        const currentIndex = itemCounter++;
                                        const isSelected = selectedIndex === currentIndex;
                                        return (
                                            <div
                                                key={doc.id}
                                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                                onClick={() => onItemClick(doc)}
                                                className={cn(
                                                    "px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-left",
                                                    isSelected
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "hover:bg-surface-container-low text-text-primary"
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold truncate text-text-primary">
                                                            {doc.name}
                                                        </p>
                                                        {doc.projectName && (
                                                            <p className="text-[11px] text-secondary truncate">
                                                                in {doc.projectName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {getDocStatusBadge(doc.status)}
                                                    <ArrowRight className="w-3 h-3 text-secondary/70" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SECTION 3: NAVIGATION & QUICK LINKS */}
                        {matchingNavigation.length > 0 && (
                            <div className="p-2">
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>
                                        {query.trim() ? `Quick Navigation (${matchingNavigation.length})` : "Quick Shortcuts"}
                                    </span>
                                </div>
                                <div className="mt-1 space-y-0.5">
                                    {matchingNavigation.map((navItem) => {
                                        const currentIndex = itemCounter++;
                                        const isSelected = selectedIndex === currentIndex;
                                        const Icon = navItem.icon;
                                        return (
                                            <div
                                                key={navItem.id}
                                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                                onClick={() => onItemClick(navItem)}
                                                className={cn(
                                                    "px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-left",
                                                    isSelected
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "hover:bg-surface-container-low text-text-primary"
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold truncate text-text-primary">
                                                            {navItem.title}
                                                        </p>
                                                        <p className="text-[11px] text-secondary truncate">
                                                            {navItem.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-3 h-3 text-secondary/70 shrink-0" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SECTION 4: TEAM MEMBERS */}
                        {matchingTeamMembers.length > 0 && (
                            <div className="p-2">
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                    <User className="w-3 h-3 text-teal-600" />
                                    <span>Team Members ({matchingTeamMembers.length})</span>
                                </div>
                                <div className="mt-1 space-y-0.5">
                                    {matchingTeamMembers.map((member) => {
                                        const currentIndex = itemCounter++;
                                        const isSelected = selectedIndex === currentIndex;
                                        return (
                                            <div
                                                key={member.id}
                                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                                onClick={() => onItemClick(member)}
                                                className={cn(
                                                    "px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-left",
                                                    isSelected
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "hover:bg-surface-container-low text-text-primary"
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
                                                        {member.name[0] || "U"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold truncate text-text-primary">
                                                            {member.name}
                                                        </p>
                                                        <p className="text-[11px] text-secondary truncate">
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0">
                                                    {member.role}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* EMPTY STATE */}
                        {query.trim().length >= 2 && !isSearching && allResults.length === 0 && (
                            <div className="py-8 px-4 text-center">
                                <Search className="w-8 h-8 text-secondary/40 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-text-primary">No results found</p>
                                <p className="text-[11px] text-secondary mt-1">
                                    No documents, projects, or pages matched "{query.trim()}".
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer: Full Document Search Action & Shortcuts */}
                    <div className="p-2.5 px-3.5 bg-surface-container-lowest border-t border-border-subtle flex items-center justify-between flex-wrap gap-2">
                        {query.trim() ? (
                            <button
                                onClick={onSearchAllClick}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                                <Search className="w-3.5 h-3.5" />
                                <span>Search all documents for "{query.trim()}"</span>
                                <CornerDownLeft className="w-3 h-3 text-secondary ml-1" />
                            </button>
                        ) : (
                            <span className="text-[11px] text-secondary">
                                Type to search across projects, documents, and navigation
                            </span>
                        )}

                        <div className="hidden sm:flex items-center gap-2 text-[10px] text-secondary">
                            <span>Use <kbd className="px-1 py-0.5 bg-surface border border-border-subtle rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-surface border border-border-subtle rounded">↓</kbd> to navigate</span>
                            <span><kbd className="px-1 py-0.5 bg-surface border border-border-subtle rounded">esc</kbd> to close</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearchBar;
