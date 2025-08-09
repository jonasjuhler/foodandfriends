import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { User, AuthState, authApi } from '../lib/auth';

interface AuthContextType {
  state: AuthState;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token);
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const hasCheckedRef = useRef(false);

  const login = async (idToken: string) => {
    try {
      const response = await authApi.googleLogin(idToken);
      dispatch({
        type: 'LOGIN',
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token && !state.isAuthenticated) {
      try {
        const user = await authApi.getCurrentUser(token);
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({
          type: 'LOGIN',
          payload: { user, token },
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch({ type: 'LOGOUT' });
      }
    }
  };

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 