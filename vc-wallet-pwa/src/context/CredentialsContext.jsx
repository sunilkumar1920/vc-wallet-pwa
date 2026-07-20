import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { fetchCredentials } from "../api/mockApi";

// --- Reducer: single source of truth for loading / error / empty / data states ---
const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

const initialState = {
  status: STATUS.IDLE,
  credentials: [],
  error: null,
};

function credentialsReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: STATUS.LOADING, error: null };
    case "FETCH_SUCCESS":
      return { ...state, status: STATUS.SUCCESS, credentials: action.payload, error: null };
    case "FETCH_ERROR":
      return { ...state, status: STATUS.ERROR, error: action.payload, credentials: [] };
    default:
      return state;
  }
}

const CredentialsContext = createContext(undefined);

export function CredentialsProvider({ children, apiOptions = {} }) {
  const [state, dispatch] = useReducer(credentialsReducer, initialState);

  const loadCredentials = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetchCredentials(apiOptions);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", payload: err.message || "Unknown error" });
    }
    // apiOptions is expected to be stable (memoized) by the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOptions]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // Memoize the context value so consumers don't re-render on every
  // provider render unless state/actions actually changed.
  const value = useMemo(
    () => ({
      ...state,
      isLoading: state.status === STATUS.LOADING,
      isError: state.status === STATUS.ERROR,
      isEmpty: state.status === STATUS.SUCCESS && state.credentials.length === 0,
      refetch: loadCredentials,
    }),
    [state, loadCredentials]
  );

  return <CredentialsContext.Provider value={value}>{children}</CredentialsContext.Provider>;
}

// Custom hook — enforces usage within the provider and keeps consumer code clean.
export function useCredentials() {
  const ctx = useContext(CredentialsContext);
  if (ctx === undefined) {
    throw new Error("useCredentials must be used within a CredentialsProvider");
  }
  return ctx;
}

export { STATUS };
