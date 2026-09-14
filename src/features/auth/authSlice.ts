import { createSlice, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import { User, Membership, authApi } from './authApi';

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
  extraReducers: (builder) => {
    builder.addMatcher(
      isAnyOf(
        authApi.endpoints.getMe.matchFulfilled,
        authApi.endpoints.login.matchFulfilled,
        authApi.endpoints.register.matchFulfilled,
        authApi.endpoints.verifyOTP.matchFulfilled,
        authApi.endpoints.acceptInvite.matchFulfilled
      ),
      (state, action) => {
        if (action.payload.data) {
          state.user = action.payload.data.user;

          // Handle register response which returns organization instead of memberships array
          if (action.payload.data.organization && !action.payload.data.memberships) {
            state.memberships = [{
              role: 'OWNER',
              organizationId: action.payload.data.organization.id
            }];
          } else {
            state.memberships = action.payload.data.memberships || [];
          }
          
          state.isAuthenticated = true;

          // Auto-select the first organization if none is selected
          if (!state.activeOrganizationId && state.memberships?.length > 0) {
            state.activeOrganizationId = state.memberships[0].organizationId;
          }
        }
      }
    );
  },
});

export const { setActiveOrganization, logoutUser } = authSlice.actions;
export default authSlice.reducer;
