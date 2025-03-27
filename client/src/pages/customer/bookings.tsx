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
import { Slot, Service, InsertBooking } from "@shared/schema";
import { Clock, Calendar, Search, IndianRupee, Info, Loader2 } from "lucide-react";
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
  DialogTrigger,
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

export default function CustomerBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOwner, setSelectedOwner] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookingNotes, setBookingNotes] = useState("");

  // Fetch all services
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  // Get unique owner IDs from services
  const ownerIds = services 
    ? [...new Set(services.map(service => service.ownerId))]
    : [];

  // Fetch available slots based on selected service and owner
  const { data: slots, isLoading: slotsLoading } = useQuery<Slot[]>({
    queryKey: ['/api/slots', { available: true, turfId: selectedService, ownerId: selectedOwner }],
    // Always enabled to get available slots
    enabled: true,
  });

  // Book a slot mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: InsertBooking) => {
      const res = await apiRequest("POST", "/api/bookings", bookingData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking confirmed!",
        description: "Your booking has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setIsDialogOpen(false);
      setSelectedSlot(null);
      setBookingNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle booking confirmation
  const handleBookService = () => {
    if (!user || !selectedSlot || !selectedService) return;
    
    const service = services?.find(s => s.id === selectedService);
    if (!service) return;
    
    const bookingData: InsertBooking = {
      customerId: user.id,
      ownerId: selectedSlot.ownerId,
      turfId: selectedService, // using turfId instead of serviceId
      slotId: selectedSlot.id,
      teamName: "Team " + user.username, // default team name
      playerCount: service.sportType === "cricket" ? 11 : 8, // default player count
      notes: bookingNotes,
      status: "confirmed"
    };
    
    console.log("Creating booking with data:", bookingData);
    createBookingMutation.mutate(bookingData);
  };

  // Filter services based on search query
  const filteredServices = services ? services.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (selectedOwner ? service.ownerId === selectedOwner : true)
  ) : [];

  // Get filtered slots based on selected service/turf
  const filteredSlots = slots ? slots.filter(slot => 
    selectedService ? slot.turfId === selectedService : true
  ) : [];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Book Services" />
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Search and filter controls */}
          <Card>
            <CardHeader>
              <CardTitle>Find and Book Services</CardTitle>
              <CardDescription>
                Browse available services and book an appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-1/2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={selectedOwner?.toString() || ""}
                  onValueChange={(value) => setSelectedOwner(value ? parseInt(value) : null)}
                >
                  <SelectTrigger className="w-full md:w-1/3">
                    <SelectValue placeholder="Filter by business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All businesses</SelectItem>
                    {ownerIds.map((ownerId) => (
                      <SelectItem key={ownerId} value={ownerId.toString()}>
                        Business #{ownerId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="services">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services">Available Services</TabsTrigger>
              <TabsTrigger value="slots" disabled={!selectedService}>Time Slots</TabsTrigger>
            </TabsList>
            
            {/* Services Tab */}
            <TabsContent value="services" className="space-y-4 mt-6">
              {servicesLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map((service) => (
                    <Card 
                      key={service.id} 
                      className={`cursor-pointer transition-shadow hover:shadow-md ${selectedService === service.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
                    >
                      <CardHeader>
                        <CardTitle>{service.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {service.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{service.duration} minutes</span>
                          </div>
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>₹{service.price.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Business #{service.ownerId}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant={selectedService === service.id ? "default" : "outline"}
                          className="w-full"
                          onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
                        >
                          {selectedService === service.id ? "Selected" : "Select Service"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No services found</h3>
                  <p className="text-muted-foreground mt-2">
                    Try adjusting your search or filters to find available services.
                  </p>
                </div>
              )}
              
              {selectedService && (
                <div className="mt-6 text-center">
                  <Button variant="default" onClick={() => document.querySelector('[value="slots"]')?.dispatchEvent(new Event('click'))}>
                    View Available Time Slots
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Slots Tab */}
            <TabsContent value="slots" className="space-y-4 mt-6">
              {selectedService ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-medium">
                        {services?.find(s => s.id === selectedService)?.name}
                      </h3>
                      <p className="text-muted-foreground">
                        Select an available time slot
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedService(null)}>
                      Change Service
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
                                  {format(parseISO(slot.startTime), 'MMMM d, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(parseISO(slot.startTime), 'h:mm a')} - {format(parseISO(slot.endTime), 'h:mm a')}
                                </span>
                              </div>
                              <Button 
                                variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => {
                                  setSelectedSlot(selectedSlot?.id === slot.id ? null : slot);
                                  if (selectedSlot?.id !== slot.id) {
                                    setIsDialogOpen(true);
                                  }
                                }}
                              >
                                {selectedSlot?.id === slot.id ? "Selected" : "Select"}
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
                        Try selecting a different service or check back later.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <Info className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No service selected</h3>
                  <p className="text-muted-foreground mt-2">
                    Please select a service first to view available time slots.
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
              
              {selectedSlot && selectedService && (
                <>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                      <Label>Service</Label>
                      <div className="font-medium">
                        {services?.find(s => s.id === selectedService)?.name}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Date</Label>
                        <div className="font-medium">
                          {format(parseISO(selectedSlot.startTime), 'MMMM d, yyyy')}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Time</Label>
                        <div className="font-medium">
                          {format(parseISO(selectedSlot.startTime), 'h:mm a')} - {format(parseISO(selectedSlot.endTime), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Price</Label>
                      <div className="font-medium">
                        ₹{(services?.find(s => s.id === selectedService)?.price || 0).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special requests or information for the service provider"
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
                      onClick={handleBookService} 
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
