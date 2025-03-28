import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth, RegisterData } from "@/hooks/use-auth";
import { LoginCredentials, RequestOtp, OtpVerification } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppHeader from "@/components/common/app-header";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(["customer", "owner"], {
    required_error: "Please select a role",
  }),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(
  (data) => {
    // If role is owner, businessName is required
    if (data.role === "owner") {
      return !!data.businessName;
    }
    return true;
  },
  {
    message: "Turf business name is required for turf owners",
    path: ["businessName"],
  }
);

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "otp">("login");
  const [otpUsername, setOtpUsername] = useState<string>("");
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, requestOtpMutation, verifyOtpMutation } = useAuth();

  // Redirect if user is already logged in
  if (user) {
    const redirectPath = user.role === "owner" ? "/owner" : "/customer";
    setLocation(redirectPath);
    return null;
  }

  // Login form
  const loginForm = useForm<LoginCredentials>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      fullName: "",
      role: "customer",
      businessName: "",
      phone: "",
      terms: false,
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: LoginCredentials) => {
    // For now, we'll just perform regular login
    // In the future, this will be replaced with OTP verification
    loginMutation.mutate(data);
    
    /* OTP Verification - Commented out until SMS API is integrated
    // Store username for OTP verification
    setOtpUsername(data.username);
    
    // Request OTP instead of direct login
    requestOtpMutation.mutate({ username: data.username });
    
    // Switch to OTP verification tab
    setActiveTab("otp");
    */
  };

  // Handle register form submission
  const onRegisterSubmit = (data: RegisterData) => {
    // For now, we'll create the user account directly
    registerMutation.mutate(data);
    
    /* OTP Verification - Commented out until SMS API is integrated
    // Store the username for OTP verification
    setOtpUsername(data.username);
    
    // After registration, switch to OTP verification
    setActiveTab("otp");
    
    // We do this with a small delay to ensure the user is created first
    setTimeout(() => {
      // Request OTP for the new account
      requestOtpMutation.mutate({ username: data.username });
    }, 1000);
    */
  };

  // Track whether business owner fields should be displayed
  const showBusinessFields = registerForm.watch("role") === "owner";

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <AppHeader className="bg-transparent text-white" />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-green-950 opacity-90"></div>
          
          {/* Grain texture overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')] opacity-20"></div>
          
          {/* Animated elements */}
          <div className="absolute w-12 h-12 rounded-full border-2 border-green-500/20 animate-float opacity-20"
            style={{ top: '20%', left: '15%', animationDelay: '0.5s' }}></div>
          <div className="absolute w-8 h-8 rounded-full bg-green-500/10 animate-float-slow opacity-10"
            style={{ top: '60%', right: '10%', animationDelay: '1s' }}></div>
          <div className="absolute w-6 h-6 transform rotate-45 border-t-2 border-l-2 border-green-400/10 animate-pulse-slow opacity-20"
            style={{ bottom: '15%', left: '20%', animationDelay: '2.5s' }}></div>
          <div className="absolute h-px w-40 bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-pulse-slow" 
            style={{ top: '40%', right: '15%', animationDelay: '1.7s' }}></div>
        </div>
        
        {/* Form section */}
        <div className="w-full md:w-1/2 py-10 px-5 md:px-10 flex flex-col justify-center relative z-10">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">TurfTime</h1>
            <p className="text-gray-400">Sign in or create an account to get started</p>
          </div>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register" | "otp")}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 text-center text-sm">
                    <span className="text-gray-600">Don't have an account? </span>
                    <button 
                      className="text-primary hover:underline font-medium"
                      onClick={() => setActiveTab("register")}
                    >
                      Register
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Fill in your details to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I am a</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="customer">Player</SelectItem>
                                <SelectItem value="owner">Turf Owner</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {showBusinessFields && (
                        <FormField
                          control={registerForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Turf Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Sports Arena" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I agree to the terms of service and privacy policy
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 text-center text-sm">
                    <span className="text-gray-600">Already have an account? </span>
                    <button 
                      className="text-primary hover:underline font-medium"
                      onClick={() => setActiveTab("login")}
                    >
                      Login
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* OTP Verification Form */}
            <TabsContent value="otp">
              <Card>
                <CardHeader>
                  <CardTitle>Verify Your Account</CardTitle>
                  <CardDescription>
                    Enter the one-time password (OTP) sent to your phone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">One-Time Password</Label>
                      <Input 
                        id="otp" 
                        placeholder="Enter OTP code" 
                        className="text-center text-xl tracking-widest" 
                        maxLength={6}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = value;
                        }}
                        disabled={true} // Disabled until OTP API is integrated
                      />
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => {
                        // Get the OTP value
                        const otpInput = document.getElementById('otp') as HTMLInputElement;
                        if (otpInput && otpInput.value.length === 6) {
                          // Submit OTP verification
                          verifyOtpMutation.mutate({
                            username: otpUsername,
                            otp: otpInput.value
                          });
                        }
                      }}
                      disabled={true} // Disabled until OTP API is integrated
                    >
                      {verifyOtpMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify"
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <span className="text-sm text-gray-500">
                        Didn't receive the code? 
                        <button 
                          className="text-primary hover:underline ml-1 font-medium"
                          onClick={() => {
                            // Request a new OTP
                            requestOtpMutation.mutate({ username: otpUsername });
                          }}
                          disabled={requestOtpMutation.isPending}
                        >
                          {requestOtpMutation.isPending ? "Sending..." : "Resend"}
                        </button>
                      </span>
                    </div>
                    
                    <div className="text-center">
                      <button 
                        className="text-sm text-gray-500 hover:underline"
                        onClick={() => setActiveTab("login")}
                      >
                        Return to login
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-green-900 to-primary hidden md:flex flex-col justify-center items-center px-5 md:px-10 relative overflow-hidden">
        {/* Animated sport shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Field lines */}
          <div className="absolute h-px w-60 bg-gradient-to-r from-transparent via-green-400/20 to-transparent animate-pulse-slow" 
            style={{ top: '20%', right: '5%', animationDelay: '0.7s' }}></div>
          <div className="absolute h-px w-40 bg-gradient-to-r from-transparent via-green-400/20 to-transparent animate-pulse-slow" 
            style={{ bottom: '30%', left: '10%', animationDelay: '1.2s' }}></div>
          
          {/* Sport icon - Cricket */}
          <div className="absolute top-[15%] left-[10%] transform -rotate-12 opacity-20">
            <svg className="w-20 h-20 text-white animate-float" style={{ animationDelay: '0.2s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2v4m0 16v-4m10-10h-4M6 12H2"></path>
              <path d="M4.9 4.9l2.8 2.8m8.4 8.4l2.8 2.8m0-14l-2.8 2.8m-8.4 8.4L4.9 19.1"></path>
            </svg>
          </div>
          
          {/* Sport icon - Football */}
          <div className="absolute bottom-[20%] right-[15%] opacity-20">
            <svg className="w-24 h-24 text-white animate-float-slow" style={{ animationDelay: '1.5s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 7l4.76 3.45 1.82-5.57-5.49 1.37L7.76 2l-.53 5.73L2 10.38l5.12 2.35L5.24 18 12 15.46 18.77 18l-1.88-5.27 5.12-2.35-5.23-2.65-.53-5.73-5.49 4.25z"></path>
            </svg>
          </div>
          
          {/* Sport icon - Badminton */}
          <div className="absolute top-[45%] right-[25%] transform rotate-45 opacity-15">
            <svg className="w-16 h-16 text-white animate-float" style={{ animationDelay: '3s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3L7 13m7 8l5-15M4 17l9-9m-1 13L7 13"></path>
            </svg>
          </div>
        </div>
        
        <div className="max-w-lg text-center text-white relative z-10">
          <h2 className="text-4xl font-bold mb-4 text-shadow">Streamline Your Booking Experience</h2>
          <p className="text-lg mb-6">
            TurfTime is a specialized platform for booking sports facilities including cricket, football, and badminton turfs, providing seamless management for turf owners and players.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Book cricket, football, and badminton turfs</p>
            </div>
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Instant slot confirmation</p>
            </div>
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Turf owner dashboard</p>
            </div>
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>24/7 booking availability</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
