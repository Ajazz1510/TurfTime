import { createContext, useContext } from "react";
import { useQuery, useMutation, } from "@tanstack/react-query";
import { insertUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
// Extend the insert schema with validation
const registerSchema = insertUserSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(2, "Full name is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const { toast } = useToast();
    const { data: user, error, isLoading, } = useQuery({
        queryKey: ["/api/user"],
        queryFn: getQueryFn({ on401: "returnNull" }),
    });
    const loginMutation = useMutation({
        mutationFn: async (credentials) => {
            const res = await apiRequest("POST", "/api/login", credentials);
            return await res.json();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({
                title: "Login successful",
                description: `Welcome back, ${user.fullName}!`,
            });
        },
        onError: (error) => {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const registerMutation = useMutation({
        mutationFn: async (userData) => {
            // Remove confirmPassword before sending to server
            const { confirmPassword, ...userDataToSend } = userData;
            const res = await apiRequest("POST", "/api/register", userDataToSend);
            return await res.json();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({
                title: "Registration successful",
                description: `Welcome, ${user.fullName}!`,
            });
        },
        onError: (error) => {
            toast({
                title: "Registration failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/logout");
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/user"], null);
            toast({
                title: "Logged out",
                description: "You have been successfully logged out.",
            });
        },
        onError: (error) => {
            toast({
                title: "Logout failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const requestOtpMutation = useMutation({
        mutationFn: async (data) => {
            const res = await apiRequest("POST", "/api/request-otp", data);
            return await res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "OTP sent",
                description: "A one-time password has been sent to your phone.",
            });
        },
        onError: (error) => {
            toast({
                title: "OTP request failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const verifyOtpMutation = useMutation({
        mutationFn: async (data) => {
            const res = await apiRequest("POST", "/api/verify-otp", data);
            return await res.json();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({
                title: "Verification successful",
                description: `Welcome back, ${user.fullName}!`,
            });
        },
        onError: (error) => {
            toast({
                title: "Verification failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    return (<AuthContext.Provider value={{
            user: user ?? null,
            isLoading,
            error,
            loginMutation,
            logoutMutation,
            registerMutation,
            requestOtpMutation,
            verifyOtpMutation,
        }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
