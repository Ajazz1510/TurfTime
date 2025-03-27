import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Slot, Turf, InsertBooking, sportTypeEnum } from "@shared/schema";
import { Clock, Calendar, Search, MapPin, IndianRupee, User, Loader2, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Helper to get price based on sport type
const getSportPrice = (sportType: string): number => {
  switch(sportType) {
    case "cricket": return 400;
    case "football": return 500;
    case "badminton": return 500;
    default: return 0;
  }
};

// Helper to get default player count based on sport type
const getDefaultPlayerCount = (sportType: string): number => {
  switch(sportType) {
    case "cricket": return 11;
    case "football": return 11;
    case "badminton": return 4;
    default: return 8;
  }
};

// Helper function to generate time options in 30-minute intervals
const generateTimeOptions = (startTime: Date, endTime: Date, intervalMinutes: number = 30): string[] => {
  const options: string[] = [];
  const currentTime = new Date(startTime);
  
  while (currentTime < endTime) {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    options.push(`${hours}:${minutes}`);
    
    currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
  }
  
  // Add the end time as the last option
  const endHours = endTime.getHours().toString().padStart(2, '0');
  const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
  options.push(`${endHours}:${endMinutes}`);
  
  return options;
};

// Helper function to format time option for display
const formatTimeOption = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return format(date, 'h:mm a');
};

export default function CustomerBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSportType, setSelectedSportType] = useState<string>("all");
  const [selectedTurf, setSelectedTurf] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookingNotes, setBookingNotes] = useState("");
  const [teamName, setTeamName] = useState(`Team ${user?.username || "Player"}`);
  const [playerCount, setPlayerCount] = useState<number>(8);
  const [activeTab, setActiveTab] = useState("turfs");
  const [selectedStartTime, setSelectedStartTime] = useState<Date | undefined>(undefined);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | undefined>(undefined);

  // Fetch all turfs
  const { data: turfs, isLoading: turfsLoading } = useQuery<Turf[]>({
    queryKey: ['/api/turfs'],
  });

  // Fetch available slots (enhanced with turf info from backend)
  const { data: slots, isLoading: slotsLoading } = useQuery<(Slot & {
    turfName?: string;
    sportType?: string;
    ownerName?: string;
  })[]>({
    queryKey: ['/api/slots', { available: "true", turfId: selectedTurf }],
    enabled: true,
  });

  // Book a slot mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: InsertBooking) => {
      console.log("Submitting booking request with data:", JSON.stringify(bookingData));
      
      try {
        const res = await apiRequest("POST", "/api/bookings", bookingData);
        
        // Log the response for debugging
        console.log("Booking response status:", res.status);
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Booking error response:", errorData);
          throw new Error(errorData.message || 'Failed to create booking');
        }
        
        const data = await res.json();
        console.log("Booking created successfully:", data);
        return data;
      } catch (error) {
        console.error("Booking request error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Booking success callback with data:", data);
      toast({
        title: "Booking confirmed!",
        description: "Your booking has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      setIsDialogOpen(false);
      setSelectedSlot(null);
      setBookingNotes("");
    },
    onError: (error: Error) => {
      console.error("Booking mutation error:", error);
      toast({
        title: "Booking failed",
        description: error.message || "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle booking confirmation
  const handleBookTurf = () => {
    if (!user || !selectedSlot || !selectedTurf) return;
    
    const turf = turfs?.find(t => t.id === selectedTurf);
    if (!turf) return;
    
    // Use custom selected times or default to slot's start/end times
    const bookingStartTime = selectedStartTime || new Date(selectedSlot.startTime);
    const bookingEndTime = selectedEndTime || new Date(selectedSlot.endTime);
    
    const bookingData: InsertBooking = {
      customerId: user.id,
      ownerId: selectedSlot.ownerId,
      turfId: selectedTurf,
      slotId: selectedSlot.id,
      teamName: teamName,
      playerCount: playerCount,
      notes: bookingNotes,
      status: "confirmed",
      bookingStartTime,
      bookingEndTime
    };
    
    console.log("Creating booking with data:", bookingData);
    createBookingMutation.mutate(bookingData);
  };

  // Filter turfs based on search query and selected sport type
  const filteredTurfs = turfs ? turfs.filter(turf => 
    (turf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    turf.location?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedSportType && selectedSportType !== "all" ? turf.sportType === selectedSportType : true)
  ) : [];

  // Get filtered slots based on selected turf
  const filteredSlots = slots ? slots.filter(slot => 
    selectedTurf ? slot.turfId === selectedTurf : true
  ) : [];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Book Turfs" />
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Search and filter controls */}
          <Card>
            <CardHeader>
              <CardTitle>Find and Book a Turf</CardTitle>
              <CardDescription>
                Browse available sports facilities and book your slot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-1/2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by turf name or location..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={selectedSportType}
                  onValueChange={(value) => setSelectedSportType(value)}
                >
                  <SelectTrigger className="w-full md:w-1/3">
                    <SelectValue placeholder="Filter by sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sports</SelectItem>
                    {sportTypeEnum.enumValues.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="turfs">Available Turfs</TabsTrigger>
              <TabsTrigger value="slots" disabled={!selectedTurf}>Available Slots</TabsTrigger>
            </TabsList>
            
            {/* Turfs Tab */}
            <TabsContent value="turfs" className="space-y-4 mt-6">
              {turfsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : filteredTurfs.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTurfs.map((turf) => (
                    <Card 
                      key={turf.id} 
                      className={`cursor-pointer transition-shadow hover:shadow-md ${selectedTurf === turf.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => {
                        const newSelectedTurf = selectedTurf === turf.id ? null : turf.id;
                        setSelectedTurf(newSelectedTurf);
                        if (newSelectedTurf) {
                          // Set default player count based on sport type
                          setPlayerCount(getDefaultPlayerCount(turf.sportType));
                          setActiveTab("slots");
                        }
                      }}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{turf.name}</CardTitle>
                          <Badge variant={turf.sportType === "cricket" ? "default" : 
                                 turf.sportType === "football" ? "outline" : "secondary"}>
                            {turf.sportType.charAt(0).toUpperCase() + turf.sportType.slice(1)}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {turf.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-3">
                          {turf.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm">{turf.location}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>₹{getSportPrice(turf.sportType).toLocaleString()} per slot</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Owner #{turf.ownerId}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant={selectedTurf === turf.id ? "default" : "outline"}
                          className="w-full"
                          onClick={() => {
                            const newSelectedTurf = selectedTurf === turf.id ? null : turf.id;
                            setSelectedTurf(newSelectedTurf);
                            if (newSelectedTurf) {
                              setActiveTab("slots");
                            }
                          }}
                        >
                          {selectedTurf === turf.id ? "Selected" : "Select Turf"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No turfs found</h3>
                  <p className="text-muted-foreground mt-2">
                    Try adjusting your search or sport type filter to find available turfs.
                  </p>
                </div>
              )}
              
              {selectedTurf && (
                <div className="mt-6 text-center">
                  <Button variant="default" onClick={() => setActiveTab("slots")}>
                    View Available Time Slots
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Slots Tab */}
            <TabsContent value="slots" className="space-y-4 mt-6">
              {selectedTurf ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-medium">
                        {turfs?.find(t => t.id === selectedTurf)?.name}
                      </h3>
                      <p className="text-muted-foreground">
                        Select an available time slot
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => {
                      setSelectedTurf(null);
                      setActiveTab("turfs");
                    }}>
                      Change Turf
                    </Button>
                  </div>
                  
                  {slotsLoading ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredSlots.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {filteredSlots.map((slot) => (
                        <Card 
                          key={slot.id} 
                          className={`cursor-pointer transition-shadow hover:shadow-md ${selectedSlot?.id === slot.id ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setSelectedSlot(selectedSlot?.id === slot.id ? null : slot)}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {format(new Date(slot.startTime), 'MMMM d, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                                </span>
                              </div>
                              <Button 
                                variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                                size="sm"
                                className="mt-2 w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSelectedSlot = selectedSlot?.id === slot.id ? null : slot;
                                  setSelectedSlot(newSelectedSlot);
                                  if (newSelectedSlot) {
                                    setIsDialogOpen(true);
                                  }
                                }}
                              >
                                {selectedSlot?.id === slot.id ? "Selected" : "Select & Book"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No available slots</h3>
                      <p className="text-muted-foreground mt-2">
                        Try selecting a different turf or check back later.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No turf selected</h3>
                  <p className="text-muted-foreground mt-2">
                    Please select a turf first to view available time slots.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Booking confirmation dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Your Booking</DialogTitle>
                <DialogDescription>
                  Please review the details of your booking below.
                </DialogDescription>
              </DialogHeader>
              
              {selectedSlot && selectedTurf && (
                <>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                      <Label>Turf</Label>
                      <div className="font-medium">
                        {turfs?.find(t => t.id === selectedTurf)?.name}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Date</Label>
                        <div className="font-medium">
                          {format(new Date(selectedSlot.startTime), 'MMMM d, yyyy')}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label>Available Time Range</Label>
                        <div className="font-medium">
                          {format(new Date(selectedSlot.startTime), 'h:mm a')} - {format(new Date(selectedSlot.endTime), 'h:mm a')}
                        </div>
                        
                        <div className="pt-2">
                          <Label>Select Your Booking Time</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                              <Select 
                                value={selectedStartTime ? format(selectedStartTime, 'HH:mm') : format(new Date(selectedSlot.startTime), 'HH:mm')}
                                onValueChange={(time: string) => {
                                  const [hours, minutes] = time.split(':').map(Number);
                                  const newDate = new Date(selectedSlot.startTime);
                                  newDate.setHours(hours, minutes);
                                  setSelectedStartTime(newDate);
                                }}
                              >
                                <SelectTrigger id="start-time">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const options = [];
                                    const start = new Date(selectedSlot.startTime);
                                    const end = new Date(selectedSlot.endTime);
                                    const currentTime = new Date(start);
                                    
                                    while (currentTime < end) {
                                      const timeStr = format(currentTime, 'HH:mm');
                                      options.push(
                                        <SelectItem key={`start-${timeStr}`} value={timeStr}>
                                          {format(currentTime, 'h:mm a')}
                                        </SelectItem>
                                      );
                                      currentTime.setMinutes(currentTime.getMinutes() + 30);
                                    }
                                    
                                    // Add the end time as the last option
                                    const endTimeStr = format(end, 'HH:mm');
                                    options.push(
                                      <SelectItem key={`start-${endTimeStr}`} value={endTimeStr}>
                                        {format(end, 'h:mm a')}
                                      </SelectItem>
                                    );
                                    
                                    return options;
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="end-time" className="text-xs">End Time</Label>
                              <Select 
                                value={selectedEndTime ? format(selectedEndTime, 'HH:mm') : format(new Date(selectedSlot.endTime), 'HH:mm')}
                                onValueChange={(time: string) => {
                                  const [hours, minutes] = time.split(':').map(Number);
                                  const newDate = new Date(selectedSlot.startTime);
                                  newDate.setHours(hours, minutes);
                                  setSelectedEndTime(newDate);
                                }}
                              >
                                <SelectTrigger id="end-time">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const options = [];
                                    const start = selectedStartTime || new Date(selectedSlot.startTime);
                                    const end = new Date(selectedSlot.endTime);
                                    const currentTime = new Date(start);
                                    
                                    while (currentTime < end) {
                                      const timeStr = format(currentTime, 'HH:mm');
                                      options.push(
                                        <SelectItem key={`end-${timeStr}`} value={timeStr}>
                                          {format(currentTime, 'h:mm a')}
                                        </SelectItem>
                                      );
                                      currentTime.setMinutes(currentTime.getMinutes() + 30);
                                    }
                                    
                                    // Add the end time as the last option
                                    const endTimeStr = format(end, 'HH:mm');
                                    options.push(
                                      <SelectItem key={`end-${endTimeStr}`} value={endTimeStr}>
                                        {format(end, 'h:mm a')}
                                      </SelectItem>
                                    );
                                    
                                    return options;
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Sport Type</Label>
                      <div className="font-medium">
                        {(() => {
                          const sportType = turfs?.find(t => t.id === selectedTurf)?.sportType || '';
                          return sportType ? sportType.charAt(0).toUpperCase() + sportType.slice(1) : 'Unknown';
                        })()}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Price</Label>
                      <div className="font-medium">
                        ₹{getSportPrice(turfs?.find(t => t.id === selectedTurf)?.sportType || '').toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="team-name">Team Name</Label>
                      <Input
                        id="team-name"
                        placeholder="Enter your team name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="player-count">Number of Players</Label>
                      <Input
                        id="player-count"
                        type="number"
                        min={1}
                        max={30}
                        placeholder="Enter number of players"
                        value={playerCount}
                        onChange={(e) => setPlayerCount(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special requests or information for the turf owner"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleBookTurf} 
                      disabled={createBookingMutation.isPending}
                    >
                      {createBookingMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Processing...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
