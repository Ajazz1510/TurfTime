import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, ClipboardList, Clock, LayoutDashboard, LogOut, Settings, Menu, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export default function Sidebar({ className }) {
    const { user, logoutMutation } = useAuth();
    const [location] = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const isCustomer = user?.role === "customer";
    const basePathSegment = isCustomer ? "/customer" : "/owner";
    const customerLinks = [
        {
            href: "/customer",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            href: "/customer/bookings",
            label: "Book Services",
            icon: Calendar,
        },
        {
            href: "/customer/history",
            label: "Booking History",
            icon: ClipboardList,
        },
        {
            href: "/customer/profile",
            label: "Profile",
            icon: Settings,
        },
    ];
    const ownerLinks = [
        {
            href: "/owner",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            href: "/owner/manage-turfs",
            label: "Manage Turfs",
            icon: Calendar,
        },
        {
            href: "/owner/manage-slots",
            label: "Manage Slots",
            icon: Clock,
        },
        {
            href: "/owner/bookings",
            label: "Manage Bookings",
            icon: ClipboardList,
        },
        {
            href: "/owner/profile",
            label: "Business Profile",
            icon: Settings,
        },
    ];
    const links = isCustomer ? customerLinks : ownerLinks;
    const handleLogout = () => {
        logoutMutation.mutate();
    };
    const toggleMobileMenu = () => {
        setMobileOpen(!mobileOpen);
    };
    return (<>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <Button variant="outline" size="icon" onClick={toggleMobileMenu} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
          {mobileOpen ? (<X className="h-5 w-5"/>) : (<Menu className="h-5 w-5"/>)}
        </Button>
      </div>

      {/* Sidebar - desktop always visible, mobile conditionally visible */}
      <div className={cn("fixed left-0 top-0 z-20 h-full w-64 flex-col bg-sidebar border-r border-gray-200 p-4 transition-transform duration-200 ease-in-out md:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full", className)}>
        <div className="flex h-full flex-col">
          {/* Logo and close button for mobile */}
          <div className="flex items-center justify-between mb-8 mt-2">
            <Link href="/landing" className="text-primary font-bold text-2xl">
              TurfTime
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="md:hidden">
              <X className="h-5 w-5"/>
            </Button>
          </div>

          {/* User info */}
          <div className="mb-8 px-4 py-3 bg-sidebar-accent rounded-lg">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-1">
              {user?.role}
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-1">
            {/* Home link */}
            <Link href="/landing" onClick={() => setMobileOpen(false)}>
              <a className={cn("flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors", location === "/landing"
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground")}>
                <Home className="mr-3 h-5 w-5"/>
                Home
              </a>
            </Link>
            
            {/* Divider */}
            <div className="my-2 border-t border-gray-200"></div>
            
            {/* Dashboard links */}
            {links.map((link) => (<Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <a className={cn("flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors", location === link.href
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground")}>
                  <link.icon className="mr-3 h-5 w-5"/>
                  {link.label}
                </a>
              </Link>))}
          </nav>

          {/* Logout button */}
          <div className="pt-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleLogout} disabled={logoutMutation.isPending}>
              <LogOut className="mr-3 h-5 w-5"/>
              {logoutMutation.isPending ? "Logging out..." : "Log out"}
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && (<div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)}/>)}
    </>);
}
