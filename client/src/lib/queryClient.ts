import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the current user and their ID token
  const user = auth.currentUser;
  let token: string | null = null;

  if (user) {
    try {
      token = await user.getIdToken();
    } catch (error) {
      console.error('Error getting user token:', error);
      throw new Error('Authentication failed');
    }
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if user is authenticated
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Special apiRequest for file uploads (FormData)
export async function apiRequestFormData(
  method: string,
  url: string,
  formData: FormData,
): Promise<Response> {
  const user = auth.currentUser;
  let token: string | null = null;

  if (user) {
    try {
      token = await user.getIdToken();
    } catch (error) {
      console.error('Error getting user token:', error);
      throw new Error('Authentication failed');
    }
  }

  const headers: HeadersInit = {};

  // Add Authorization header if user is authenticated
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: formData,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const user = auth.currentUser;
    let token: string | null = null;

    if (user) {
      try {
        token = await user.getIdToken();
      } catch (error) {
        console.error('Error getting user token:', error);
        if (unauthorizedBehavior === "throw") {
          throw new Error('Authentication failed');
        }
        return null;
      }
    }

    const headers: HeadersInit = {};

    // Add Authorization header if user is authenticated
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});