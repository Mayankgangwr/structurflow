import { baseApi } from "@/services/baseApi";
import { RoleType } from "@/features/auth/hooks/usePermissions";

export interface TeamMember {
    membershipId: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    role: RoleType;
    joinedAt: string;
    lastLoginAt?: string | null;
}

export interface PendingInvite {
    id: string;
    email: string;
    role: RoleType;
    status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
    expiresAt: string;
    createdAt: string;
    inviter: {
        id: string;
        name: string;
        email: string;
    } | null;
}

export const teamApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTeamMembers: builder.query<{ success: boolean; data: TeamMember[] }, void>({
            query: () => ({
                url: "/team/members",
                method: "GET",
            }),
            providesTags: ["Team"],
        }),

        getPendingInvites: builder.query<{ success: boolean; data: PendingInvite[] }, void>({
            query: () => ({
                url: "/team/invites",
                method: "GET",
            }),
            providesTags: ["Invites"],
        }),

        inviteMember: builder.mutation<
            { success: boolean; data: any },
            { email: string; role: RoleType }
        >({
            query: (body) => ({
                url: "/team/invite",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Invites"],
        }),

        updateMemberRole: builder.mutation<
            { success: boolean; data: any },
            { userId: string; role: RoleType }
        >({
            query: ({ userId, role }) => ({
                url: `/team/member/${userId}/role`,
                method: "PUT",
                body: { role },
            }),
            invalidatesTags: ["Team"],
        }),

        removeMember: builder.mutation<
            { success: boolean; data: any },
            { userId: string }
        >({
            query: ({ userId }) => ({
                url: `/team/member/${userId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Team"],
        }),

        revokeInvite: builder.mutation<
            { success: boolean; data: any },
            { inviteId: string }
        >({
            query: ({ inviteId }) => ({
                url: `/team/invite/${inviteId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Invites"],
        }),

        resendInvite: builder.mutation<
            { success: boolean; data: any },
            { inviteId: string }
        >({
            query: ({ inviteId }) => ({
                url: `/team/invite/${inviteId}/resend`,
                method: "POST",
            }),
            invalidatesTags: ["Invites"],
        }),
    }),
});

export const {
    useGetTeamMembersQuery,
    useGetPendingInvitesQuery,
    useInviteMemberMutation,
    useUpdateMemberRoleMutation,
    useRemoveMemberMutation,
    useRevokeInviteMutation,
    useResendInviteMutation,
} = teamApi;
