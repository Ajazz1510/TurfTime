import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Loader2, AlertCircle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
export default function CustomerHistory() {
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    // Fetch bookings
    const { data: bookings, isLoading: bookingsLoading } = useQuery({
        queryKey: ['/api/bookings'],
    });
    // No need to fetch services anymore since the API provides turf details
    // Get turf name from enhanced booking data
    const getTurfName = (booking) => {
        return booking.turfName || "Unknown Turf";
    };
    // Filter bookings by status and search query
    const filteredBookings = bookings?.filter(booking => {
        const matchesStatus = statusFilter ? booking.status === statusFilter : true;
        const turfName = getTurfName(booking).toLowerCase();
        const matchesSearch = searchQuery
            ? turfName.includes(searchQuery.toLowerCase()) ||
                booking.id.toString().includes(searchQuery) ||
                booking.notes?.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        return matchesStatus && matchesSearch;
    });
    // Separate bookings by status
    const completedBookings = filteredBookings?.filter(b => b.status === "completed") || [];
    const canceledBookings = filteredBookings?.filter(b => b.status === "cancelled") || [];
    const confirmedBookings = filteredBookings?.filter(b => b.status === "confirmed") || [];
    // Booking status icon mapping
    const statusIcons = {
        completed: <CheckCircle className="h-5 w-5 text-green-500"/>,
        cancelled: <XCircle className="h-5 w-5 text-red-500"/>,
        confirmed: <Clock className="h-5 w-5 text-blue-500"/>,
        pending: <AlertCircle className="h-5 w-5 text-yellow-500"/>
    };
    // Booking card component
    const BookingCard = ({ booking }) => (<Card key={booking.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-2">
              {statusIcons[booking.status] ||
            <AlertCircle className="h-5 w-5 text-gray-500"/>}
            </div>
            <CardTitle className="text-lg">
              {getTurfName(booking)}
            </CardTitle>
          </div>
          <Badge variant={booking.status === "completed" ? "default" :
            booking.status === "cancelled" ? "destructive" : "secondary"}>
            {booking.status}
          </Badge>
        </div>
        <CardDescription>
          Booking #{booking.id} • {booking.sportType || "Unknown"} Field
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground"/>
            <span className="text-sm">
              Booking date: {format(new Date(booking.bookingStartTime || new Date()), 'MMMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground"/>
            <span className="text-sm">
              Booking time: {format(new Date(booking.bookingStartTime || new Date()), 'h:mm a')} to {format(new Date(booking.bookingEndTime || new Date()), 'h:mm a')}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-sm bg-primary/10 text-primary px-2 py-1 rounded">
              Service ID: {booking.serviceId || `TT-${booking.id}`}
            </span>
          </div>
          
          {booking.notes && (<div className="text-sm text-muted-foreground border-t pt-2 mt-2">
              <span className="font-medium text-foreground">Notes:</span> {booking.notes}
            </div>)}
        </div>
      </CardContent>
    </Card>);
    // Loading state
    if (bookingsLoading) {
        return (<div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64">
          <Header title="Booking History"/>
          <main className="flex-1 p-4 md:p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4"/>
                <p className="text-muted-foreground">Loading your booking history...</p>
              </div>
            </div>
          </main>
        </div>
      </div>);
    }
    return (<div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Booking History"/>
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Booking History</CardTitle>
              <CardDescription>
                View and manage all your past and upcoming bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="search" className="mb-2 block">Search bookings</Label>
                  <Input id="search" placeholder="Search by turf name or booking ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                </div>
                <div>
                  <Label htmlFor="status" className="mb-2 block">Filter by status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All bookings"/>
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
              
              {filteredBookings?.length === 0 ? (<div className="text-center py-10">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4"/>
                  <h3 className="text-lg font-medium">No bookings found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchQuery || statusFilter
                ? "Try adjusting your filters to see more bookings."
                : "You haven't made any bookings yet."}
                  </p>
                  {(searchQuery || statusFilter) && (<Button variant="outline" className="mt-4" onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                }}>
                      <RotateCcw className="mr-2 h-4 w-4"/>
                      Reset Filters
                    </Button>)}
                </div>) : (<Tabs defaultValue="all">
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
                    <TabsTrigger value="cancelled">
                      Cancelled ({canceledBookings.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    {filteredBookings?.map(booking => (<BookingCard key={booking.id} booking={booking}/>))}
                  </TabsContent>
                  
                  <TabsContent value="confirmed" className="mt-4">
                    {confirmedBookings.length > 0 ? (confirmedBookings.map(booking => (<BookingCard key={booking.id} booking={booking}/>))) : (<div className="text-center py-6">
                        <p className="text-muted-foreground">No confirmed bookings found.</p>
                      </div>)}
                  </TabsContent>
                  
                  <TabsContent value="completed" className="mt-4">
                    {completedBookings.length > 0 ? (completedBookings.map(booking => (<BookingCard key={booking.id} booking={booking}/>))) : (<div className="text-center py-6">
                        <p className="text-muted-foreground">No completed bookings found.</p>
                      </div>)}
                  </TabsContent>
                  
                  <TabsContent value="cancelled" className="mt-4">
                    {canceledBookings.length > 0 ? (canceledBookings.map(booking => (<BookingCard key={booking.id} booking={booking}/>))) : (<div className="text-center py-6">
                        <p className="text-muted-foreground">No cancelled bookings found.</p>
                      </div>)}
                  </TabsContent>
                </Tabs>)}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>);
}
