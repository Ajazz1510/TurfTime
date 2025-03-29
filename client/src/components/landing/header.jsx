import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, Footprints, Clock } from "lucide-react";
export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth();
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };
    const renderAuthButton = () => {
        if (user) {
            const dashboardLink = user.role === "owner" ? "/owner" : "/customer";
            return (<Button asChild className="bg-primary hover:bg-primary/80">
          <Link href={dashboardLink}>
            Dashboard
          </Link>
        </Button>);
        }
        return (<div className="flex space-x-2">
        <Button asChild variant="outline" className="border-green-600 text-green-500 hover:text-green-400">
          <Link href="/auth">
            Sign Up
          </Link>
        </Button>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/auth">
            Log In
          </Link>
        </Button>
      </div>);
    };
    return (<header className="bg-black/95 backdrop-blur-sm border-b border-green-900/40 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/landing" className="flex items-center">
                <Footprints className="h-6 w-6 text-primary mr-2"/>
                <span className="font-bold text-xl">
                  <span className="text-primary">Turf</span>
                  <span className="text-white">Time</span>
                </span>
              </Link>
            </div>
          </div>

          <nav className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
            <a href="#how-it-works" className="border-transparent text-gray-300 hover:border-green-500 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              <Clock className="h-4 w-4 mr-1"/> How It Works
            </a>

            {renderAuthButton()}
          </nav>

          <div className="flex items-center sm:hidden">
            <button type="button" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary" aria-controls="mobile-menu" aria-expanded="false" onClick={toggleMobileMenu}>
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (<X className="block h-6 w-6" aria-hidden="true"/>) : (<Menu className="block h-6 w-6" aria-hidden="true"/>)}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (<div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1 bg-black border-b border-green-900/40">
            <a href="#how-it-works" className="border-transparent text-gray-300 hover:bg-gray-900 hover:border-green-500 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center" onClick={() => setMobileMenuOpen(false)}>
              <Clock className="h-5 w-5 mr-2"/> How It Works
            </a>
            <div className="mt-4 px-4 pb-2 space-y-2">
              <Button className="w-full" variant="outline" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link href="/auth">Sign Up</Link>
              </Button>
              <Button className="w-full" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link href="/auth">Log In</Link>
              </Button>
            </div>
          </div>
        </div>)}
    </header>);
}
