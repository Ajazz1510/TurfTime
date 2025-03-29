import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, Clock, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
export default function CustomerDashboard() {
    const { user } = useAuth();
    // Fetch upcoming bookings
    const { data: bookings, isLoading: bookingsLoading } = useQuery({
        queryKey: ['/api/bookings'],
    });
    // Filter bookings to get only upcoming ones (not canceled or completed)
    const upcomingBookings = bookings?.filter((booking) => booking.status !== "canceled" && booking.status !== "completed") || [];
    // Fetch available services
    const { data: services, isLoading: servicesLoading } = useQuery({
        queryKey: ['/api/services'],
    });
    return (<div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Customer Dashboard"/>
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Welcome message */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user?.fullName}</CardTitle>
              <CardDescription>
                Here's an overview of your upcoming bookings and available services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="mt-2">
                <Link href="/customer/bookings">Book a new service</Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Upcoming bookings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>
            {bookingsLoading ? (<div className="space-y-3">
                <Skeleton className="h-32 w-full"/>
                <Skeleton className="h-32 w-full"/>
              </div>) : upcomingBookings.length > 0 ? (<div className="grid gap-4 md:grid-cols-2">
                {upcomingBookings.map((booking) => (<Card key={booking.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          Booking #{booking.id}
                        </CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {booking.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500"/>
                          <span className="text-sm">
                            Booking date: {format(new Date(booking.bookingStartTime), 'MMMM d, yyyy')}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500"/>
                          <span className="text-sm">
                            Booking time: {format(new Date(booking.bookingStartTime), 'h:mm a')} to {format(new Date(booking.bookingEndTime), 'h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                            Service ID: {booking.serviceId || `TT-${booking.id}`}
                          </span>
                        </div>
                        
                        {booking.notes && (<div className="text-sm mt-2 text-gray-600">
                            <span className="font-medium">Notes:</span> {booking.notes}
                          </div>)}
                      </div>
                    </CardContent>
                  </Card>))}
              </div>) : (<Card>
                <CardContent className="pt-6 pb-6 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-2"/>
                  <p className="text-muted-foreground">You don't have any upcoming bookings.</p>
                  <Button asChild className="mt-4">
                    <Link href="/customer/bookings">Book a service now</Link>
                  </Button>
                </CardContent>
              </Card>)}
          </div>
          
          {/* Available services */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Services</h2>
            {servicesLoading ? (<div className="space-y-3">
                <Skeleton className="h-24 w-full"/>
                <Skeleton className="h-24 w-full"/>
                <Skeleton className="h-24 w-full"/>
              </div>) : services && services.length > 0 ? (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.slice(0, 6).map((service) => (<Card key={service.id}>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-lg mb-2">{service.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-1 text-gray-500"/>
                          <span>{service.duration} mins</span>
                        </div>
                        <div className="font-semibold">
                          ₹{service.price.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>))}
              </div>) : (<Card>
                <CardContent className="pt-6 pb-6 text-center">
                  <p className="text-muted-foreground">No services available at the moment.</p>
                </CardContent>
              </Card>)}
            
            {services && services.length > 6 && (<div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href="/customer/bookings">View all services</Link>
                </Button>
              </div>)}
          </div>
        </main>
      </div>
    </div>);
}
