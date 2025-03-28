import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Booking, Slot, Turf } from "@shared/schema";
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
  const [customerData, setCustomerData] = useState<Record<number, any>>({});

  // Fetch bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });
  
  // Fetch customer data when bookings change
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      // Get unique customer IDs
      const customerIds = Array.from(new Set(bookings.map(booking => booking.customerId)));
      
      // Fetch customer data for each customer ID
      Promise.all(
        customerIds.map(id => 
          fetch(`/api/users/${id}`)
            .then(res => res.json())
            .catch(err => {
              console.error(`Error fetching customer ${id}:`, err);
              return null;
            })
        )
      ).then(customersData => {
        const customerMap: Record<number, any> = {};
        customersData.forEach(customer => {
          if (customer && customer.id) {
            customerMap[customer.id] = customer;
          }
        });
        setCustomerData(customerMap);
      });
    }
  }, [bookings]);

  // Fetch turfs for reference
  const { data: turfs, isLoading: turfsLoading } = useQuery<Turf[]>({
    queryKey: ['/api/turfs', { ownerId: user?.id }],
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

  // Get turf name by ID
  const getTurfName = (turfId: number) => {
    if (!turfs) return "Loading...";
    const foundTurf = turfs.find((t) => t.id === turfId);
    return foundTurf ? foundTurf.name : "Unknown Turf";
  };
  
  // Get customer display information
  const getCustomerDisplay = (customerId: number, booking?: Booking) => {
    const customer = customerData[customerId];
    if (!customer) return `Loading...`;
    
    // If booking is provided, use its teamName, otherwise display "No team"
    const teamName = booking?.teamName || 'No team';
    return `${customer.username} (${teamName})`;
  };
  
  // Get service ID display
  const getServiceDisplay = (serviceId: string) => {
    return serviceId || "Service ID not available";
  };

  // Format booking time directly from booking data rather than slot
  const getBookingTime = (booking: Booking) => {
    if (!booking.bookingStartTime || !booking.bookingEndTime) return "Not specified";
    return `${format(new Date(booking.bookingStartTime), 'h:mm a')} - ${format(new Date(booking.bookingEndTime), 'h:mm a')}`;
  };

  // Get booking date directly from booking data
  const getBookingDate = (booking: Booking) => {
    if (!booking.bookingStartTime) return "Not specified";
    return format(new Date(booking.bookingStartTime), 'MMMM d, yyyy');
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
  const filteredBookings = bookings ? bookings.filter((booking) => {
    const matchesStatus = statusFilter ? booking.status === statusFilter : true;
    // Use serviceId for search instead of service name
    const serviceIdDisplay = booking.serviceId || `TT-${booking.id}`;
    const matchesSearch = searchQuery 
      ? serviceIdDisplay.toLowerCase().includes(searchQuery.toLowerCase()) || 
        booking.id.toString().includes(searchQuery) ||
        booking.customerId.toString().includes(searchQuery) ||
        (booking.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true;
    return matchesStatus && matchesSearch;
  }) : [];

  // Separate bookings by status
  const confirmedBookings = filteredBookings.filter((b: Booking) => b.status === "confirmed");
  const completedBookings = filteredBookings.filter((b: Booking) => b.status === "completed");
  // Note: Database uses "cancelled" but UI uses "canceled"
  const canceledBookings = filteredBookings.filter((b: Booking) => b.status === "cancelled");

  // Bookings table component
  const BookingsTable = ({ bookings }: { bookings: Booking[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Turf</TableHead>
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
                <TableCell className="font-medium">{booking.serviceId || `TT-${booking.id}`}</TableCell>
                <TableCell>{getCustomerDisplay(booking.customerId, booking)}</TableCell>
                <TableCell>{getTurfName(booking.turfId)}</TableCell>
                <TableCell>{getBookingDate(booking)}</TableCell>
                <TableCell>{getBookingTime(booking)}</TableCell>
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
  if (bookingsLoading || turfsLoading || slotsLoading) {
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
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">
                    All ({filteredBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="confirmed">
                    Confirmed ({confirmedBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({completedBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Cancelled ({canceledBookings.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <BookingsTable bookings={filteredBookings} />
                </TabsContent>
                
                <TabsContent value="confirmed" className="mt-4">
                  <BookingsTable bookings={confirmedBookings} />
                </TabsContent>
                
                <TabsContent value="completed" className="mt-4">
                  <BookingsTable bookings={completedBookings} />
                </TabsContent>
                
                <TabsContent value="cancelled" className="mt-4">
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
                      <div className="text-sm">{getCustomerDisplay(selectedBooking.customerId, selectedBooking)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Service ID</Label>
                      <div className="text-sm">{selectedBooking.serviceId || `TT-${selectedBooking.id}`}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date & Time</Label>
                      <div className="text-sm">
                        {getBookingDate(selectedBooking)}, {getBookingTime(selectedBooking)}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Turf</Label>
                    <div className="text-sm">{getTurfName(selectedBooking.turfId)}</div>
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
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
