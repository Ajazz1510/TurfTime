import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InsertTurf, Turf, sportTypeEnum } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Trash2, Edit, AlertCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

// Custom sport icons
const CricketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M6 12l4 4" />
    <path d="M14 8l4 4" />
    <line x1="7" y1="7" x2="17" y2="17" />
  </svg>
);

const FootballIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 10 10" />
    <path d="M12 12l9 3" />
    <path d="M12 12l-9 3" />
    <path d="M12 12l3-9" />
    <path d="M12 12l-3-9" />
    <path d="M8 16l2-4" />
    <path d="M16 8l-4 2" />
  </svg>
);

const BadmintonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <line x1="6" y1="18" x2="18" y2="6" />
    <path d="M10 14l8-8" />
  </svg>
);

// Schema for turf creation
const turfFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  sportType: z.enum(["cricket", "football", "badminton"]),
  maxPlayers: z.string().transform(val => parseInt(val)),
  duration: z.string().transform(val => parseInt(val)),
  price: z.string().transform(val => parseInt(val)),
  location: z.string().min(3, "Location must be at least 3 characters"),
  latitude: z.string()
    .optional()
    .transform(val => val ? parseFloat(val) : null),
  longitude: z.string()
    .optional()
    .transform(val => val ? parseFloat(val) : null),
  amenities: z.object({
    changeRooms: z.boolean().default(false),
    floodlights: z.boolean().default(false),
    parking: z.boolean().default(false),
    refreshments: z.boolean().default(false),
    equipment: z.boolean().default(false),
  }),
});

type TurfFormValues = z.infer<typeof turfFormSchema>;

export default function ManageTurfs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingTurf, setIsCreatingTurf] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);

  // Fetch owner's turfs
  const { data: turfs, isLoading: turfsLoading } = useQuery<Turf[]>({
    queryKey: ['/api/turfs'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', `/api/turfs?ownerId=${user.id}`);
      return res.json();
    },
  });

  // Form for creating turfs
  const form = useForm<TurfFormValues>({
    resolver: zodResolver(turfFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sportType: "cricket",
      maxPlayers: "22",
      duration: "60",
      price: "400",
      location: "",
      latitude: "",
      longitude: "",
      amenities: {
        changeRooms: false,
        floodlights: false,
        parking: false,
        refreshments: false,
        equipment: false,
      },
    },
  });

  // Create turf mutation
  const createTurfMutation = useMutation({
    mutationFn: async (turfData: InsertTurf) => {
      const res = await apiRequest("POST", "/api/turfs", turfData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/turfs'] });
      toast({
        title: "Turf created",
        description: "Your turf has been successfully created.",
      });
      setIsDialogOpen(false);
      setIsCreatingTurf(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create turf",
        description: error.message,
        variant: "destructive",
      });
      setIsCreatingTurf(false);
    }
  });

  // Update turf mutation
  const updateTurfMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Turf> }) => {
      const res = await apiRequest("PATCH", `/api/turfs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/turfs'] });
      toast({
        title: "Turf updated",
        description: "Your turf has been successfully updated.",
      });
      setIsDialogOpen(false);
      setIsCreatingTurf(false);
      setEditingTurf(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update turf",
        description: error.message,
        variant: "destructive",
      });
      setIsCreatingTurf(false);
    }
  });

  // Delete turf mutation
  const deleteTurfMutation = useMutation({
    mutationFn: async (turfId: number) => {
      await apiRequest("DELETE", `/api/turfs/${turfId}`);
      return turfId;
    },
    onSuccess: (turfId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/turfs'] });
      toast({
        title: "Turf deleted",
        description: "The turf has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete turf",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle turf creation/update
  const onSubmit = (data: TurfFormValues) => {
    if (!user) return;
    
    setIsCreatingTurf(true);
    
    const turfData = {
      ...data,
      ownerId: user.id,
    };
    
    if (editingTurf) {
      // Update existing turf
      updateTurfMutation.mutate({ 
        id: editingTurf.id, 
        data: turfData
      });
    } else {
      // Create new turf
      createTurfMutation.mutate(turfData as InsertTurf);
    }
  };

  // Open edit dialog
  const handleEdit = (turf: Turf) => {
    setEditingTurf(turf);
    
    form.reset({
      name: turf.name,
      description: turf.description || "",
      sportType: turf.sportType,
      maxPlayers: turf.maxPlayers.toString(),
      duration: turf.duration.toString(),
      price: turf.price.toString(),
      location: turf.location || "",
      latitude: turf.latitude ? turf.latitude.toString() : "",
      longitude: turf.longitude ? turf.longitude.toString() : "",
      amenities: {
        changeRooms: turf.amenities.changeRooms || false,
        floodlights: turf.amenities.floodlights || false,
        parking: turf.amenities.parking || false,
        refreshments: turf.amenities.refreshments || false,
        equipment: turf.amenities.equipment || false,
      },
    });
    
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingTurf(null);
      form.reset();
    }
    setIsDialogOpen(open);
  };

  // Render sport type icon
  const getSportIcon = (sportType: string) => {
    switch (sportType) {
      case "cricket":
        return <CricketIcon />;
      case "football":
        return <FootballIcon />;
      case "badminton":
        return <BadmintonIcon />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Manage Turfs" />
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">My Turfs</h1>
              <p className="text-muted-foreground">
                Create and manage your sports turfs
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Turf
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>{editingTurf ? "Edit Turf" : "Create New Turf"}</DialogTitle>
                  <DialogDescription>
                    {editingTurf ? "Update your turf details" : "Add a new sports turf to your listings"}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Turf Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Premium Cricket Ground" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sport Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sport type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cricket">Cricket</SelectItem>
                              <SelectItem value="football">Football</SelectItem>
                              <SelectItem value="badminton">Badminton</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="maxPlayers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Players</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Maximum number of players allowed
                            </FormDescription>
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
                              <Input type="number" step="15" {...field} />
                            </FormControl>
                            <FormDescription>
                              Default slot duration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Price per slot in INR
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Central Stadium" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.000001" 
                                placeholder="12.9716" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Geographic coordinate (e.g., 12.9716)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.000001" 
                                placeholder="77.5946" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Geographic coordinate (e.g., 77.5946)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your turf facilities and features" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel>Amenities</FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <FormField
                          control={form.control}
                          name="amenities.changeRooms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Change Rooms
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="amenities.floodlights"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Floodlights
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="amenities.parking"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Parking
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="amenities.refreshments"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Refreshments
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="amenities.equipment"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Equipment
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={isCreatingTurf}
                      >
                        {isCreatingTurf ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingTurf ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          editingTurf ? "Update Turf" : "Create Turf"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {turfsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-[100px] bg-gray-800/20 rounded-t-lg" />
                  <CardContent className="pt-6">
                    <div className="h-6 bg-gray-800/20 rounded mb-2"></div>
                    <div className="h-4 bg-gray-800/20 rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-gray-800/20 rounded mb-2"></div>
                    <div className="h-4 bg-gray-800/20 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !turfs || turfs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-xl mb-2">No Turfs Added Yet</CardTitle>
                <CardDescription className="mb-4">
                  You haven't added any turfs to your profile. Click the button above to add your first turf.
                </CardDescription>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Turf
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {turfs.map((turf) => (
                <Card key={turf.id} className="overflow-hidden">
                  <div className={cn(
                    "h-[100px] flex items-center justify-center",
                    turf.sportType === "cricket" ? "bg-emerald-900/30" : 
                    turf.sportType === "football" ? "bg-blue-900/30" :
                    "bg-purple-900/30"
                  )}>
                    <div className="h-16 w-16 rounded-full bg-background/20 flex items-center justify-center">
                      {getSportIcon(turf.sportType)}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <span className="flex-1">{turf.name}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        turf.sportType === "cricket" ? "bg-emerald-900/20 text-emerald-400" : 
                        turf.sportType === "football" ? "bg-blue-900/20 text-blue-400" :
                        "bg-purple-900/20 text-purple-400"
                      )}>
                        {turf.sportType.charAt(0).toUpperCase() + turf.sportType.slice(1)}
                      </span>
                    </CardTitle>
                    <CardDescription>{turf.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">{turf.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Max Players:</span> {turf.maxPlayers}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span> {turf.duration} mins
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Price:</span> <span className="font-medium">₹{turf.price}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {turf.amenities.changeRooms && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">Change Rooms</span>
                      )}
                      {turf.amenities.floodlights && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">Floodlights</span>
                      )}
                      {turf.amenities.parking && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">Parking</span>
                      )}
                      {turf.amenities.refreshments && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">Refreshments</span>
                      )}
                      {turf.amenities.equipment && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">Equipment</span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(turf)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteTurfMutation.mutate(turf.id)}
                      disabled={deleteTurfMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}