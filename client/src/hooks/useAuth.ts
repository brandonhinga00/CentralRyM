import { useQuery } from "@tanstack/react-query";
import { supabase, getCurrentUser } from "../lib/authUtils";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
