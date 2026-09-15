import { reactive, readonly } from 'vue';
import { ApiError, authenticateUser, endSession, getCurrentUser } from './api';

const state = reactive({
  user: null,
  initialized: false,
});

let initialization = null;

export async function initializeAuth(force = false) {
  if (state.initialized && !force) return state.user;
  if (initialization && !force) return initialization;

  initialization = getCurrentUser()
    .then((result) => {
      state.user = result.user;
      return state.user;
    })
    .catch((error) => {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      state.user = null;
      return null;
    })
    .finally(() => {
      state.initialized = true;
      initialization = null;
    });

  return initialization;
}

export async function login(username, password) {
  const result = await authenticateUser(username, password);
  state.user = result.user;
  state.initialized = true;
  return state.user;
}

export async function logout() {
  try {
    await endSession();
  } finally {
    clearAuth();
  }
}

export function clearAuth() {
  state.user = null;
  state.initialized = true;
}

export function useAuth() {
  return {
    state: readonly(state),
    initializeAuth,
    login,
    logout,
  };
}

export const authState = readonly(state);
