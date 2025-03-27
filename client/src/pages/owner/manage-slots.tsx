import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service, InsertSlot, Slot } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addHours, setHours, setMinutes, parse, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// Schema for slot creation
const slotFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  duration: z.string().min(1, "Please select or enter duration"),
});

type SlotFormValues = z.infer<typeof slotFormSchema>;

export default function ManageSlots() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);
  const [isCreatingSingleSlot, setIsCreatingSingleSlot] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number>(1);

  // Fetch owner's services
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services', { ownerId: user?.id }],
  });

  // Fetch owner's slots
  const { data: slots, isLoading: slotsLoading } = useQuery<Slot[]>({
    queryKey: ['/api/slots', { ownerId: user?.id }],
  });

  // Form for creating slots
  const form = useForm<SlotFormValues>({
    resolver: zodResolver(slotFormSchema),
    defaultValues: {
      serviceId: "",
      startTime: "09:00",
      duration: "",
    },
  });

  // Create slot mutation
  const createSlotMutation = useMutation({
    mutationFn: async (slotData: InsertSlot) => {
      const res = await apiRequest("POST", "/api/slots", slotData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create slot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      await apiRequest("DELETE", `/api/slots/${slotId}`);
      return slotId;
    },
    onSuccess: (slotId) => {
      toast({
        title: "Slot deleted",
        description: "The time slot has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete slot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter services for the selected service
  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    form.setValue("serviceId", value);
    
    // Set duration based on selected service
    if (value && services) {
      const service = services.find(s => s.id.toString() === value);
      if (service) {
        form.setValue("duration", service.duration.toString());
      }
    }
  };

  // Handle single slot creation
  const onSubmitSingleSlot = (data: SlotFormValues) => {
    if (!user) return;
    
    setIsCreatingSingleSlot(true);
    
    // Parse form data
    const serviceId = parseInt(data.serviceId);
    const service = services?.find(s => s.id === serviceId);
    
    if (!service) {
      toast({
        title: "Invalid service",
        description: "Please select a valid service.",
        variant: "destructive",
      });
      setIsCreatingSingleSlot(false);
      return;
    }
    
    // Parse time
    const [hours, minutes] = data.startTime.split(':').map(Number);
    const startTime = new Date(data.date);
    startTime.setHours(hours, minutes, 0, 0);
    
    // Calculate end time
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + parseInt(data.duration));
    
    // Create slot
    const slotData: InsertSlot = {
      ownerId: user.id,
      serviceId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isBooked: false,
    };
    
    createSlotMutation.mutate(slotData, {
      onSuccess: () => {
        toast({
          title: "Slot created",
          description: "The time slot has been successfully created.",
        });
        setIsDialogOpen(false);
        setIsCreatingSingleSlot(false);
        form.reset({
          serviceId: data.serviceId,
          startTime: data.startTime,
          duration: data.duration,
        });
      },
      onError: () => {
        setIsCreatingSingleSlot(false);
      }
    });
  };

  // Handle multiple slots generation
  const generateMultipleSlots = () => {
    if (!user || !form.getValues("serviceId") || !form.getValues("date") || !form.getValues("startTime") || !form.getValues("duration") || repeatDays < 1) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to generate slots.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingSlots(true);
    
    const { serviceId, date, startTime, duration } = form.getValues();
    const serviceIdNum = parseInt(serviceId);
    const durationNum = parseInt(duration);
    const service = services?.find(s => s.id === serviceIdNum);
    
    if (!service) {
      toast({
        title: "Invalid service",
        description: "Please select a valid service.",
        variant: "destructive",
      });
      setIsGeneratingSlots(false);
      return;
    }
    
    // Parse time
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Generate slots for each day
    const slotPromises = [];
    
    for (let i = 0; i < repeatDays; i++) {
      const slotDate = new Date(date);
      slotDate.setDate(slotDate.getDate() + i);
      
      const startDateTime = new Date(slotDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + durationNum);
      
      const slotData: InsertSlot = {
        ownerId: user.id,
        serviceId: serviceIdNum,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isBooked: false,
      };
      
      slotPromises.push(createSlotMutation.mutateAsync(slotData));
    }
    
    // Wait for all slots to be created
    Promise.all(slotPromises)
      .then(() => {
        toast({
          title: "Slots generated",
          description: `Successfully created ${repeatDays} slots.`,
        });
        setIsDialogOpen(false);
        setIsGeneratingSlots(false);
        form.reset({
          serviceId,
          startTime,
          duration,
        });
      })
      .catch((error) => {
        toast({
          title: "Failed to generate slots",
          description: error.message,
          variant: "destructive",
        });
        setIsGeneratingSlots(false);
      });
  };

  // Get service name by ID
  const getServiceName = (serviceId: number) => {
    if (!services) return "Loading...";
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  // Filter slots by service
  const filteredSlots = slots 
    ? selectedService 
      ? slots.filter(slot => slot.serviceId.toString() === selectedService)
      : slots
    : [];

  // Sort slots by date
  const sortedSlots = [...(filteredSlots || [])].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  // Group slots by date
  const slotsByDate = sortedSlots.reduce((acc, slot) => {
    const date = format(parseISO(slot.startTime), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Manage Time Slots" />
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Time Slots</h1>
              <p className="text-muted-foreground">
                Create and manage appointment time slots for your services
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Slots
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create Time Slots</DialogTitle>
                  <DialogDescription>
                    Add new appointment slots for your services
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="single">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single Slot</TabsTrigger>
                    <TabsTrigger value="multiple">Multiple Slots</TabsTrigger>
                  </TabsList>
                  
                  <Form {...form}>
                    <div className="py-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="serviceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={handleServiceChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {servicesLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                  </div>
                                ) : services && services.length > 0 ? (
                                  services.map((service) => (
                                    <SelectItem 
                                      key={service.id} 
                                      value={service.id.toString()}
                                    >
                                      {service.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-center text-sm text-muted-foreground">
                                    No services found
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="time"
                                placeholder="HH:MM"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="15"
                                step="15"
                                placeholder="60"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <TabsContent value="multiple" className="pt-4">
                        <FormItem>
                          <FormLabel>Repeat for Days</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              value={repeatDays}
                              onChange={(e) => setRepeatDays(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            Create slots for multiple consecutive days
                          </FormDescription>
                        </FormItem>
                      </TabsContent>
                    </div>
                    
                    <DialogFooter>
                      <TabsContent value="single">
                        <Button 
                          type="button" 
                          onClick={form.handleSubmit(onSubmitSingleSlot)}
                          disabled={isCreatingSingleSlot}
                        >
                          {isCreatingSingleSlot ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Slot"
                          )}
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="multiple">
                        <Button 
                          type="button" 
                          onClick={generateMultipleSlots}
                          disabled={isGeneratingSlots}
                        >
                          {isGeneratingSlots ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate Slots"
                          )}
                        </Button>
                      </TabsContent>
                    </DialogFooter>
                  </Form>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Manage Available Time Slots</CardTitle>
              <CardDescription>
                View, filter and delete your appointment slots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Filter by Service</label>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {servicesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : services && services.length > 0 ? (
                      services.map((service) => (
                        <SelectItem 
                          key={service.id} 
                          value={service.id.toString()}
                        >
                          {service.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No services found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {slotsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : Object.keys(slotsByDate).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                    <div key={date}>
                      <h3 className="text-lg font-medium mb-4">
                        {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Service</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dateSlots.map((slot) => (
                              <TableRow key={slot.id}>
                                <TableCell className="font-medium">
                                  {getServiceName(slot.serviceId)}
                                </TableCell>
                                <TableCell>
                                  {format(parseISO(slot.startTime), 'h:mm a')} - {format(parseISO(slot.endTime), 'h:mm a')}
                                </TableCell>
                                <TableCell>
                                  {Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60))} min
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    slot.isBooked 
                                      ? "bg-red-100 text-red-800" 
                                      : "bg-green-100 text-green-800"
                                  }`}>
                                    {slot.isBooked ? "Booked" : "Available"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteSlotMutation.mutate(slot.id)}
                                    disabled={slot.isBooked || deleteSlotMutation.isPending}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No time slots found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {selectedService 
                      ? "There are no time slots for the selected service. Try selecting a different service or create new slots."
                      : "You haven't created any time slots yet. Click the button below to create your first slot."}
                  </p>
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Slots
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
