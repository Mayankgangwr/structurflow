import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Membership } from './authApi';

interface AuthState {
  user: User | null;
  memberships: Membership[];
  activeOrganizationId: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  memberships: [],
  activeOrganizationId: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; memberships: Membership[] }>
    ) => {
      state.user = action.payload.user;
      state.memberships = action.payload.memberships;
      state.isAuthenticated = true;

      // Auto-select the first organization if none is selected
      if (!state.activeOrganizationId && action.payload.memberships?.length > 0) {
        state.activeOrganizationId = action.payload.memberships[0].organizationId;
      }
    },

    // Fix: Added this reducer to persist the active organization when user
    // logs in via invitation or password reset (where email/password might
    // not have been used for the latest login action)
    setActiveOrganization: (state, action: PayloadAction<string>) => {
      state.activeOrganizationId = action.payload;
    },

    logoutUser: (state) => {
      state.user = null;
      state.memberships = [];
      state.activeOrganizationId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setActiveOrganization, logoutUser } = authSlice.actions;
export default authSlice.reducer;
