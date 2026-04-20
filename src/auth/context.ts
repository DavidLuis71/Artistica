
import type { Session, User } from "@supabase/supabase-js";
import { createContext } from "react";
export type Profile = {
  id: string;
  nombre?: string;
  rol_id?: number;
  aprobado?: boolean;
} | null;

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AUTH_CONTEXT_DEFAULT: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
};




export const AuthContext = createContext<AuthContextType>(AUTH_CONTEXT_DEFAULT);
