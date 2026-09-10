"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGetAllDocumentsQuery } from "@/features/documents/documentApi";
import { useGetProjectsQuery } from "@/features/projects/projectApi";
import { useGetTeamMembersQuery } from "@/features/team/teamApi";
import {
    LayoutDashboard,
    Folder,
    ClipboardCheck,
    FileText,
    BarChart2,
    History,
    Users,
    Settings,
    CircleHelp,
    LucideIcon,
} from "lucide-react";

export interface NavigationSearchItem {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    keywords: string[];
    category: "navigation";
}

export interface ProjectSearchItem {
    id: string;
    name: string;
    description: string;
    documentsCount: number;
    href: string;
    category: "projects";
}

export interface DocumentSearchItem {
    id: string;
    name: string;
    status: string;
    projectName?: string;
    sizeBytes?: number;
    href: string;
    category: "documents";
}

export interface TeamMemberSearchItem {
    id: string;
    name: string;
    email: string;
    role: string;
    href: string;
    category: "team";
}

export type SearchResultItem =
    | NavigationSearchItem
    | ProjectSearchItem
    | DocumentSearchItem
    | TeamMemberSearchItem;

// Predefined app navigation destinations with rich keywords
export const APP_NAVIGATION_ITEMS: NavigationSearchItem[] = [
    {
        id: "nav-dashboard",
        title: "Dashboard",
        description: "Workspace overview, metrics, throughput, and system KPIs",
        href: "/dashboard",
        icon: LayoutDashboard,
        keywords: ["home", "overview", "metrics", "kpi", "stats", "summary"],
        category: "navigation",
    },
    {
        id: "nav-projects",
        title: "Projects & Pipelines",
        description: "Manage document pipelines, active templates, and configurations",
        href: "/project",
        icon: Folder,
        keywords: ["pipelines", "templates", "schemas", "folders", "workflows"],
        category: "navigation",
    },
    {
        id: "nav-verification",
        title: "Verification Workbench",
        description: "Human-in-the-Loop review, inline corrections, and audit sign-off",
        href: "/verification",
        icon: ClipboardCheck,
        keywords: ["review", "hitl", "audit", "correct", "approve", "reject", "queue"],
        category: "navigation",
    },
    {
        id: "nav-documents",
        title: "All Documents",
        description: "Repository of uploaded, transformed, and verified files",
        href: "/documents",
        icon: FileText,
        keywords: ["files", "pdf", "invoices", "uploads", "exports", "library"],
        category: "navigation",
    },
    {
        id: "nav-analytics",
        title: "Analytics & Trends",
        description: "AI extraction confidence, throughput velocity, and error rates",
        href: "/analytics",
        icon: BarChart2,
        keywords: ["charts", "graphs", "confidence", "trends", "velocity", "reports"],
        category: "navigation",
    },
    {
        id: "nav-activity",
        title: "Activity & Audit Log",
        description: "Immutable compliance ledger and chronological user audit trail",
        href: "/activity",
        icon: History,
        keywords: ["audit", "logs", "security", "history", "compliance", "events"],
        category: "navigation",
    },
    {
        id: "nav-team",
        title: "Team Management",
        description: "Organization members, role permissions, and pending invitations",
        href: "/team",
        icon: Users,
        keywords: ["members", "roles", "rbac", "invite", "users", "admin", "owner"],
        category: "navigation",
    },
    {
        id: "nav-settings",
        title: "Workspace Settings",
        description: "Profile preferences, password security, and system thresholds",
        href: "/settings",
        icon: Settings,
        keywords: ["preferences", "password", "profile", "organization", "thresholds"],
        category: "navigation",
    },
    {
        id: "nav-support",
        title: "Support & Documentation",
        description: "FAQ guides, API documentation, and help desk contact",
        href: "/support",
        icon: CircleHelp,
        keywords: ["help", "docs", "faq", "contact", "support", "questions"],
        category: "navigation",
    },
];

export function useGlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Debounce search query by 250ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 250);
        return () => clearTimeout(timer);
    }, [query]);

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [debouncedQuery]);

    // API Queries (executed when debounced query is present)
    const shouldFetch = debouncedQuery.length >= 2;

    const { data: docsData, isFetching: isDocsFetching } = useGetAllDocumentsQuery(
        shouldFetch ? { search: debouncedQuery, limit: 5 } : undefined,
        { skip: !shouldFetch }
    );

    const { data: projectsData, isFetching: isProjectsFetching } = useGetProjectsQuery(
        shouldFetch ? { search: debouncedQuery, limit: 5 } : undefined,
        { skip: !shouldFetch }
    );

    const { data: teamData, isFetching: isTeamFetching } = useGetTeamMembersQuery(
        undefined,
        { skip: !shouldFetch }
    );

    const isSearching = isDocsFetching || isProjectsFetching || isTeamFetching;

    // 1. Filtered Navigation Items
    const matchingNavigation = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            // When empty, return top 4 popular quick navigation links
            return APP_NAVIGATION_ITEMS.slice(0, 4);
        }
        return APP_NAVIGATION_ITEMS.filter((item) => {
            const matchesTitle = item.title.toLowerCase().includes(q);
            const matchesDesc = item.description.toLowerCase().includes(q);
            const matchesKeywords = item.keywords.some((kw) => kw.includes(q));
            return matchesTitle || matchesDesc || matchesKeywords;
        }).slice(0, 3);
    }, [query]);

    // 2. Filtered Projects
    const matchingProjects: ProjectSearchItem[] = useMemo(() => {
        if (!shouldFetch || !projectsData?.data?.projects) return [];
        return projectsData.data.projects.map((p) => ({
            id: p.id || (p as any)._id,
            name: p.name,
            description: p.description,
            documentsCount: p.documents || 0,
            href: `/project/${p.id || (p as any)._id}`,
            category: "projects" as const,
        }));
    }, [shouldFetch, projectsData]);

    // 3. Filtered Documents
    const matchingDocuments: DocumentSearchItem[] = useMemo(() => {
        if (!shouldFetch || !docsData?.data?.documents) return [];
        return docsData.data.documents.map((doc: any) => ({
            id: doc._id || doc.id,
            name: doc.originalFileName || doc.originalFilename || "Untitled Document",
            status: doc.status || "UPLOADED",
            projectName: doc.projectId?.name || (typeof doc.projectId === "string" ? "Project" : undefined),
            sizeBytes: doc.sizeBytes,
            href: `/documents?search=${encodeURIComponent(doc.originalFileName || doc.originalFilename || "")}`,
            category: "documents" as const,
        }));
    }, [shouldFetch, docsData]);

    // 4. Filtered Team Members
    const matchingTeamMembers: TeamMemberSearchItem[] = useMemo(() => {
        if (!shouldFetch || !teamData?.data) return [];
        const q = debouncedQuery.toLowerCase();
        return teamData.data
            .filter((m) => {
                const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
                const email = m.email.toLowerCase();
                return fullName.includes(q) || email.includes(q);
            })
            .slice(0, 3)
            .map((m) => ({
                id: m.membershipId || m.userId,
                name: `${m.firstName} ${m.lastName}`.trim(),
                email: m.email,
                role: m.role,
                href: "/team",
                category: "team" as const,
            }));
    }, [shouldFetch, debouncedQuery, teamData]);

    // Flatten all items for keyboard arrow navigation
    const allResults = useMemo<SearchResultItem[]>(() => {
        return [
            ...matchingProjects,
            ...matchingDocuments,
            ...matchingNavigation,
            ...matchingTeamMembers,
        ];
    }, [matchingProjects, matchingDocuments, matchingNavigation, matchingTeamMembers]);

    const handleSelect = useCallback(
        (item: SearchResultItem) => {
            setIsOpen(false);
            setQuery("");
            router.push(item.href);
        },
        [router]
    );

    const handleSubmitAllDocuments = useCallback(() => {
        if (query.trim()) {
            setIsOpen(false);
            router.push(`/documents?search=${encodeURIComponent(query.trim())}`);
        }
    }, [query, router]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (allResults.length > 0) {
                    setSelectedIndex((prev) => (prev + 1) % allResults.length);
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (allResults.length > 0) {
                    setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
                }
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (allResults.length > 0 && allResults[selectedIndex]) {
                    handleSelect(allResults[selectedIndex]);
                } else {
                    handleSubmitAllDocuments();
                }
            } else if (e.key === "Escape") {
                setIsOpen(false);
            }
        },
        [allResults, selectedIndex, handleSelect, handleSubmitAllDocuments]
    );

    return {
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
    };
}
