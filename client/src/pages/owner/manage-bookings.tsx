import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Booking, Service, Slot } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Search, Filter } from "lucide-react";

export default function ManageBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  // Fetch bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  // Fetch services for reference
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services', { ownerId: user?.id }],
  });

  // Fetch slots for reference
  const { data: slots, isLoading: slotsLoading } = useQuery<Slot[]>({
    queryKey: ['/api/slots', { ownerId: user?.id }],
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { status?: string, notes?: string } }) => {
      const res = await apiRequest("PUT", `/api/bookings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking updated",
        description: "The booking has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setIsUpdateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bookings/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Booking canceled",
        description: "The booking has been successfully canceled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get service name by ID
  const getServiceName = (serviceId: number) => {
    if (!services) return "Loading...";
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  // Get slot time by ID
  const getSlotTime = (slotId: number) => {
    if (!slots) return "Loading...";
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return "Unknown Time";
    
    return `${format(new Date(slot.startTime), 'h:mm a')} - ${format(new Date(slot.endTime), 'h:mm a')}`;
  };

  // Get slot date by ID
  const getSlotDate = (slotId: number) => {
    if (!slots) return "Loading...";
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return "Unknown Date";
    return format(new Date(slot.startTime), 'MMMM d, yyyy');
  };

  // Handle booking update
  const handleUpdateBooking = () => {
    if (!selectedBooking) return;
    
    const updateData: { status?: string, notes?: string } = {};
    if (bookingStatus) updateData.status = bookingStatus;
    if (bookingNotes !== selectedBooking.notes) updateData.notes = bookingNotes;
    
    if (Object.keys(updateData).length === 0) {
      setIsUpdateDialogOpen(false);
      return;
    }
    
    updateBookingMutation.mutate({ id: selectedBooking.id, data: updateData });
  };

  // Filter bookings by status and search query
  const filteredBookings = bookings?.filter(booking => {
    const matchesStatus = statusFilter ? booking.status === statusFilter : true;
    const serviceName = getServiceName(booking.serviceId).toLowerCase();
    const matchesSearch = searchQuery 
      ? serviceName.includes(searchQuery.toLowerCase()) || 
        booking.id.toString().includes(searchQuery) ||
        booking.customerId.toString().includes(searchQuery) ||
        (booking.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true;
    return matchesStatus && matchesSearch;
  });

  // Separate bookings by status
  const confirmedBookings = filteredBookings?.filter(b => b.status === "confirmed") || [];
  const completedBookings = filteredBookings?.filter(b => b.status === "completed") || [];
  const canceledBookings = filteredBookings?.filter(b => b.status === "canceled") || [];

  // Bookings table component
  const BookingsTable = ({ bookings }: { bookings: Booking[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.id}</TableCell>
                <TableCell>Customer #{booking.customerId}</TableCell>
                <TableCell>{getServiceName(booking.serviceId)}</TableCell>
                <TableCell>{getSlotDate(booking.slotId)}</TableCell>
                <TableCell>{getSlotTime(booking.slotId)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      booking.status === "confirmed" ? "outline" :
                      booking.status === "completed" ? "default" : "destructive"
                    }
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setBookingStatus(booking.status);
                        setBookingNotes(booking.notes || "");
                        setIsUpdateDialogOpen(true);
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                    {booking.status === "confirmed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel this booking?")) {
                            deleteBookingMutation.mutate(booking.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteBookingMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No bookings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Loading state
  if (bookingsLoading || servicesLoading || slotsLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64">
          <Header title="Manage Bookings" />
          <main className="flex-1 p-4 md:p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-full max-w-md mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Manage Bookings" />
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bookings Overview</CardTitle>
              <CardDescription>
                View and manage all your customer bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="search" className="mb-2 block">Search bookings</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by service name, booking ID..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status" className="mb-2 block">Filter by status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="All bookings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All bookings</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">
                    All ({filteredBookings?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="confirmed">
                    Confirmed ({confirmedBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({completedBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="canceled">
                    Canceled ({canceledBookings.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <BookingsTable bookings={filteredBookings || []} />
                </TabsContent>
                
                <TabsContent value="confirmed" className="mt-4">
                  <BookingsTable bookings={confirmedBookings} />
                </TabsContent>
                
                <TabsContent value="completed" className="mt-4">
                  <BookingsTable bookings={completedBookings} />
                </TabsContent>
                
                <TabsContent value="canceled" className="mt-4">
                  <BookingsTable bookings={canceledBookings} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Update Booking Dialog */}
          <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Update Booking</DialogTitle>
                <DialogDescription>
                  Update the status or notes for this booking
                </DialogDescription>
              </DialogHeader>
              
              {selectedBooking && (
                <div className="py-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Booking ID</Label>
                      <div className="text-sm">{selectedBooking.id}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Customer</Label>
                      <div className="text-sm">Customer #{selectedBooking.customerId}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Service</Label>
                      <div className="text-sm">{getServiceName(selectedBooking.serviceId)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date & Time</Label>
                      <div className="text-sm">
                        {getSlotDate(selectedBooking.slotId)}, {getSlotTime(selectedBooking.slotId)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <Select
                      value={bookingStatus}
                      onValueChange={setBookingStatus}
                    >
                      <SelectTrigger id="status" className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="mt-1"
                      placeholder="Add notes about this booking"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateBooking}
                  disabled={updateBookingMutation.isPending}
                >
                  {updateBookingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Booking"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
