import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, MapPin, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
// Calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
export default function NearbyTurfs() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [userLocation, setUserLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [nearbyTurfs, setNearbyTurfs] = useState([]);
    // Fetch all turfs data
    const { data: turfs, isLoading } = useQuery({
        queryKey: ['/api/turfs'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/turfs');
            return res.json();
        },
    });
    // Get user's location
    const getUserLocation = () => {
        if (navigator.geolocation) {
            setLoadingLocation(true);
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLoadingLocation(false);
                toast({
                    title: "Location detected",
                    description: "We've found your location and are showing nearby turfs.",
                });
            }, (error) => {
                console.error("Error getting user location:", error);
                setLoadingLocation(false);
                toast({
                    title: "Location access denied",
                    description: "Please enable location access to see nearby turfs.",
                    variant: "destructive",
                });
            });
        }
        else {
            toast({
                title: "Geolocation not supported",
                description: "Your browser doesn't support geolocation.",
                variant: "destructive",
            });
        }
    };
    // Calculate nearby turfs whenever user location or turfs data changes
    useEffect(() => {
        if (userLocation && turfs && turfs.length > 0) {
            // Filter turfs that have location data
            const turfsWithLocation = turfs.filter(turf => turf.latitude != null && turf.longitude != null);
            // Calculate distance for each turf and sort by nearest
            const turfsWithDistance = turfsWithLocation.map(turf => ({
                ...turf,
                distance: getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, turf.latitude, turf.longitude)
            })).sort((a, b) => a.distance - b.distance);
            // Take the 4 nearest turfs
            setNearbyTurfs(turfsWithDistance.slice(0, 4));
        }
    }, [userLocation, turfs]);
    // Sport type background color mapping
    const getSportTypeStyles = (sportType) => {
        switch (sportType) {
            case "cricket":
                return "bg-emerald-900/20 text-emerald-400 dark:bg-emerald-900/30";
            case "football":
                return "bg-blue-900/20 text-blue-400 dark:bg-blue-900/30";
            case "badminton":
                return "bg-purple-900/20 text-purple-400 dark:bg-purple-900/30";
            default:
                return "bg-gray-900/20 text-gray-400 dark:bg-gray-900/30";
        }
    };
    const handleBookNow = () => {
        setLocation('/auth');
    };
    return (<section className="py-16 bg-black/40">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Turfs Near You</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find and book sports turfs in your area
          </p>
          
          {!userLocation && (<Button onClick={getUserLocation} className="mt-4" disabled={loadingLocation}>
              {loadingLocation ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Getting location...
                </>) : (<>
                  <MapPin className="mr-2 h-4 w-4"/>
                  Find turfs near me
                </>)}
            </Button>)}
        </div>
        
        {userLocation && nearbyTurfs.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyTurfs.map((turf) => (<Card key={turf.id} className="overflow-hidden">
                <div className={cn("h-32 flex items-center justify-center", getSportTypeStyles(turf.sportType))}>
                  <h3 className="text-xl font-bold">{turf.sportType.toUpperCase()}</h3>
                </div>
                <CardHeader>
                  <CardTitle>{turf.name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1"/>
                    {turf.location} ({turf.distance.toFixed(1)} km away)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm line-clamp-2">{turf.description}</p>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="font-semibold">₹{turf.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <span>{turf.duration} mins</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleBookNow} className="w-full">
                    Book Now
                    <ChevronsRight className="ml-2 h-4 w-4"/>
                  </Button>
                </CardFooter>
              </Card>))}
          </div>)}
        
        {userLocation && nearbyTurfs.length === 0 && !isLoading && (<div className="text-center py-10">
            <p className="text-muted-foreground mb-4">
              No turfs found near your location.
            </p>
            <Button onClick={() => setLocation('/auth')}>
              Browse all turfs
            </Button>
          </div>)}
        
        {isLoading && userLocation && (<div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
          </div>)}
      </div>
    </section>);
}
