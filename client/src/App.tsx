import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

// Page imports
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";

// Customer pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerBookings from "@/pages/customer/bookings";
import CustomerHistory from "@/pages/customer/history";
import CustomerProfile from "@/pages/customer/profile";

// Owner pages
import OwnerDashboard from "@/pages/owner/dashboard";
import ManageSlots from "@/pages/owner/manage-slots";
import ManageTurfs from "@/pages/owner/manage-turfs";
import ManageBookings from "@/pages/owner/manage-bookings";
import OwnerProfile from "@/pages/owner/profile";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Customer routes */}
      <ProtectedRoute path="/customer" component={CustomerDashboard} allowedRoles={["customer"]} />
      <ProtectedRoute path="/customer/bookings" component={CustomerBookings} allowedRoles={["customer"]} />
      <ProtectedRoute path="/customer/history" component={CustomerHistory} allowedRoles={["customer"]} />
      <ProtectedRoute path="/customer/profile" component={CustomerProfile} allowedRoles={["customer"]} />
      
      {/* Owner routes */}
      <ProtectedRoute path="/owner" component={OwnerDashboard} allowedRoles={["owner"]} />
      <ProtectedRoute path="/owner/manage-turfs" component={ManageTurfs} allowedRoles={["owner"]} />
      <ProtectedRoute path="/owner/manage-slots" component={ManageSlots} allowedRoles={["owner"]} />
      <ProtectedRoute path="/owner/bookings" component={ManageBookings} allowedRoles={["owner"]} />
      <ProtectedRoute path="/owner/profile" component={OwnerProfile} allowedRoles={["owner"]} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
