import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Footprints } from "lucide-react";
export default function AppHeader({ className }) {
    return (<div className={cn("py-3 px-4 flex items-center border-b", className)}>
      <Link href="/landing">
        <a className="flex items-center gap-2 text-2xl font-bold hover:text-primary/90 transition-colors cursor-pointer">
          <Footprints className="h-6 w-6 text-primary"/>
          <span>
            <span className="text-primary">Turf</span>
            <span>Time</span>
          </span>
        </a>
      </Link>
    </div>);
}
