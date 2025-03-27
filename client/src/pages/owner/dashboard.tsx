import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Booking, Service } from "@shared/schema";
import { Calendar, Clock, Users, DollarSign, CheckCircle, XCircle, ArrowUpRight, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Dashboard stats interface
interface DashboardStats {
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  bookingsByService: Record<number, number>;
  upcomingBookings: number;
  totalServices: number;
  totalSlots: number;
  availableSlots: number;
}

export default function OwnerDashboard() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
  });

  // Fetch services for reference
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services', { ownerId: user?.id }],
  });

  // Fetch bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  // Service lookup function
  const getServiceName = (serviceId: number) => {
    if (!services) return `Service #${serviceId}`;
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : `Service #${serviceId}`;
  };

  // Prepare chart data
  const pieChartData = stats?.bookingsByStatus 
    ? Object.entries(stats.bookingsByStatus).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count
      }))
    : [];

  const barChartData = stats?.bookingsByService && services
    ? Object.entries(stats.bookingsByService).map(([serviceId, count]) => ({
        name: getServiceName(parseInt(serviceId)),
        bookings: count
      }))
    : [];

  // Colors for the pie chart
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Owner Dashboard" />
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Welcome message */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime bookings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.upcomingBookings || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Active appointments
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.availableSlots || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {stats?.totalSlots || 0} total slots
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{services?.length || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Active service offerings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Bookings by Status</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {statsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-64 w-64 rounded-full" />
                  </div>
                ) : pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p>No booking data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Bookings by Service</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {statsLoading || servicesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p>No service booking data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : bookings && bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center border-b pb-4 last:border-0 last:pb-0">
                      <div className="mr-4">
                        {booking.status === "confirmed" ? (
                          <Clock className="h-8 w-8 text-blue-500" />
                        ) : booking.status === "completed" ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {getServiceName(booking.serviceId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Customer #{booking.customerId} • {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          booking.status === "confirmed" 
                            ? "bg-blue-100 text-blue-800" 
                            : booking.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {booking.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No bookings found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
