import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
// Schema for slot creation
const slotFormSchema = z.object({
    turfId: z.string().min(1, "Please select a turf"),
    date: z.date({
        required_error: "Please select a date",
    }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
    duration: z.string().min(1, "Please select or enter duration"),
});
export default function ManageSlots() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTurf, setSelectedTurf] = useState("");
    const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);
    const [isCreatingSingleSlot, setIsCreatingSingleSlot] = useState(false);
    const [repeatDays, setRepeatDays] = useState(1);
    // Fetch owner's turfs
    const { data: turfs, isLoading: turfsLoading } = useQuery({
        queryKey: ['/api/turfs'],
        queryFn: async () => {
            if (!user)
                return [];
            const res = await apiRequest('GET', `/api/turfs?ownerId=${user.id}`);
            return res.json();
        },
    });
    // Fetch owner's slots
    const { data: slots, isLoading: slotsLoading } = useQuery({
        queryKey: ['/api/slots'],
        queryFn: async () => {
            if (!user)
                return [];
            const res = await apiRequest('GET', `/api/slots?ownerId=${user.id}`);
            return res.json();
        },
    });
    // Form for creating slots
    const form = useForm({
        resolver: zodResolver(slotFormSchema),
        defaultValues: {
            turfId: "",
            startTime: "09:00",
            duration: "",
        },
    });
    // Create slot mutation
    const createSlotMutation = useMutation({
        mutationFn: async (slotData) => {
            const res = await apiRequest("POST", "/api/slots", slotData);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
        },
        onError: (error) => {
            toast({
                title: "Failed to create slot",
                description: error.message,
                variant: "destructive",
            });
        }
    });
    // Delete slot mutation
    const deleteSlotMutation = useMutation({
        mutationFn: async (slotId) => {
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
        onError: (error) => {
            toast({
                title: "Failed to delete slot",
                description: error.message,
                variant: "destructive",
            });
        }
    });
    // Filter turfs for the selected turf
    const handleTurfChange = (value) => {
        setSelectedTurf(value);
        form.setValue("turfId", value);
        // Set duration based on selected turf
        if (value && turfs) {
            const turf = turfs.find(t => t.id.toString() === value);
            if (turf) {
                form.setValue("duration", turf.duration.toString());
            }
        }
    };
    // Handle single slot creation
    const onSubmitSingleSlot = (data) => {
        if (!user)
            return;
        setIsCreatingSingleSlot(true);
        // Parse form data
        const turfId = parseInt(data.turfId);
        const turf = turfs?.find(t => t.id === turfId);
        if (!turf) {
            toast({
                title: "Invalid turf",
                description: "Please select a valid turf.",
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
        const slotData = {
            ownerId: user.id,
            turfId,
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
                    turfId: data.turfId,
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
        if (!user || !form.getValues("turfId") || !form.getValues("date") || !form.getValues("startTime") || !form.getValues("duration") || repeatDays < 1) {
            toast({
                title: "Missing information",
                description: "Please fill in all fields to generate slots.",
                variant: "destructive",
            });
            return;
        }
        setIsGeneratingSlots(true);
        const { turfId, date, startTime, duration } = form.getValues();
        const turfIdNum = parseInt(turfId);
        const durationNum = parseInt(duration);
        const turf = turfs?.find(t => t.id === turfIdNum);
        if (!turf) {
            toast({
                title: "Invalid turf",
                description: "Please select a valid turf.",
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
            const slotData = {
                ownerId: user.id,
                turfId: turfIdNum,
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
                turfId,
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
    // Get turf name by ID
    const getTurfName = (turfId) => {
        if (!turfs)
            return "Loading...";
        const turf = turfs.find(t => t.id === turfId);
        return turf ? turf.name : "Unknown Turf";
    };
    // Filter slots by turf
    const filteredSlots = slots
        ? selectedTurf
            ? slots.filter(slot => slot.turfId.toString() === selectedTurf)
            : slots
        : [];
    // Sort slots by date
    const sortedSlots = [...(filteredSlots || [])].sort((a, b) => {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    // Group slots by date
    const slotsByDate = sortedSlots.reduce((acc, slot) => {
        const date = format(new Date(slot.startTime), 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(slot);
        return acc;
    }, {});
    return (<div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Manage Time Slots"/>
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Time Slots</h1>
              <p className="text-muted-foreground">
                Create and manage time slots for your turfs
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4"/>
                  Create New Slots
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create Time Slots</DialogTitle>
                  <DialogDescription>
                    Add new availability slots for your turfs
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="single">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single Slot</TabsTrigger>
                    <TabsTrigger value="multiple">Multiple Slots</TabsTrigger>
                  </TabsList>
                  
                  <Form {...form}>
                    <div className="py-4 space-y-4">
                      <FormField control={form.control} name="turfId" render={({ field }) => (<FormItem>
                            <FormLabel>Turf</FormLabel>
                            <Select value={field.value} onValueChange={handleTurfChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a turf"/>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {turfsLoading ? (<div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                                  </div>) : turfs && turfs.length > 0 ? (turfs.map((turf) => (<SelectItem key={turf.id} value={turf.id.toString()}>
                                      {turf.name} - {turf.sportType}
                                    </SelectItem>))) : (<div className="p-2 text-center text-sm text-muted-foreground">
                                    No turfs found
                                  </div>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>)}/>
                      
                      <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus/>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>)}/>
                      
                      <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" placeholder="HH:MM"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>)}/>
                      
                      <FormField control={form.control} name="duration" render={({ field }) => (<FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="15" step="15" placeholder="60"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>)}/>
                      
                      <TabsContent value="multiple" className="pt-4">
                        <FormItem>
                          <FormLabel>Repeat for Days</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="30" value={repeatDays} onChange={(e) => setRepeatDays(parseInt(e.target.value) || 1)}/>
                          </FormControl>
                          <FormDescription>
                            Create slots for multiple consecutive days
                          </FormDescription>
                        </FormItem>
                      </TabsContent>
                    </div>
                    
                    <DialogFooter>
                      <TabsContent value="single">
                        <Button type="button" onClick={form.handleSubmit(onSubmitSingleSlot)} disabled={isCreatingSingleSlot}>
                          {isCreatingSingleSlot ? (<>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                              Creating...
                            </>) : ("Create Slot")}
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="multiple">
                        <Button type="button" onClick={generateMultipleSlots} disabled={isGeneratingSlots}>
                          {isGeneratingSlots ? (<>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                              Generating...
                            </>) : ("Generate Slots")}
                        </Button>
                      </TabsContent>
                    </DialogFooter>
                  </Form>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Filter by Turf</h2>
            </div>
            <Select value={selectedTurf} onValueChange={setSelectedTurf}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="All Turfs"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Turfs</SelectItem>
                {turfsLoading ? (<div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                  </div>) : turfs && turfs.length > 0 ? (turfs.map((turf) => (<SelectItem key={turf.id} value={turf.id.toString()}>
                      {turf.name} - {turf.sportType}
                    </SelectItem>))) : (<div className="p-2 text-center text-sm text-muted-foreground">
                    No turfs found
                  </div>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-6">
            {slotsLoading ? (<div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-sm"/>
                <Skeleton className="h-64 w-full rounded-md"/>
              </div>) : sortedSlots.length === 0 ? (<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-10 w-10 text-primary"/>
                </div>
                <h2 className="mt-6 text-xl font-semibold">No time slots found</h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  You haven't created any time slots yet. Click the "Create New Slots" button to add availability for your turfs.
                </p>
              </div>) : (<div className="space-y-8">
                {Object.entries(slotsByDate).map(([date, daySlots]) => (<Card key={date}>
                    <CardHeader className="pb-3">
                      <CardTitle>{format(new Date(date), 'EEEE, MMMM d, yyyy')}</CardTitle>
                      <CardDescription>
                        {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'} available
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Turf</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daySlots.map(slot => {
                    const startTime = new Date(slot.startTime);
                    const endTime = new Date(slot.endTime);
                    const durationMs = endTime.getTime() - startTime.getTime();
                    const durationMins = Math.round(durationMs / (1000 * 60));
                    return (<TableRow key={slot.id}>
                                <TableCell className="font-medium">
                                  {getTurfName(slot.turfId)}
                                </TableCell>
                                <TableCell>
                                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                </TableCell>
                                <TableCell>
                                  {durationMins} minutes
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className={`mr-2 h-2 w-2 rounded-full ${slot.isBooked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <span>{slot.isBooked ? 'Booked' : 'Available'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {!slot.isBooked && (<Button variant="outline" size="icon" onClick={() => deleteSlotMutation.mutate(slot.id)} disabled={deleteSlotMutation.isPending}>
                                      <Trash2 className="h-4 w-4"/>
                                    </Button>)}
                                </TableCell>
                              </TableRow>);
                })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>))}
              </div>)}
          </div>
        </main>
      </div>
    </div>);
}
