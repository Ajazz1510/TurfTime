import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
// Profile update schema
const profileSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    businessName: z.string().min(2, "Business name is required"),
    businessType: z.string().min(1, "Business type is required"),
    phone: z.string().optional(),
});
export default function OwnerProfile() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    // Create form
    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user?.fullName || "",
            email: user?.email || "",
            businessName: user?.businessName || "",
            businessType: user?.businessType || "",
            phone: user?.phone || "",
        },
    });
    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data) => {
            const res = await apiRequest("PUT", "/api/profile", data);
            return res.json();
        },
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(["/api/user"], updatedUser);
            toast({
                title: "Profile updated",
                description: "Your business profile has been successfully updated.",
            });
            setIsEditing(false);
        },
        onError: (error) => {
            toast({
                title: "Update failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // Handle form submission
    const onSubmit = (data) => {
        updateProfileMutation.mutate(data);
    };
    // Business types options
    const businessTypes = [
        { value: "salon", label: "Salon / Spa" },
        { value: "healthcare", label: "Healthcare" },
        { value: "fitness", label: "Fitness / Gym" },
        { value: "restaurant", label: "Restaurant" },
        { value: "professional", label: "Professional Services" },
        { value: "other", label: "Other" },
    ];
    return (<div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header title="Business Profile"/>
        
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                View and update your business profile information
              </CardDescription>
            </CardHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-medium">{user?.businessName}</h3>
                      <p className="text-muted-foreground text-sm">
                        Business Owner Account
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={updateProfileMutation.isPending}>
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>
                  
                  <FormField control={form.control} name="businessName" render={({ field }) => (<FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your business name" disabled={!isEditing || updateProfileMutation.isPending}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}/>
                  
                  <FormField control={form.control} name="businessType" render={({ field }) => (<FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing || updateProfileMutation.isPending}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type"/>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypes.map((type) => (<SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>)}/>
                  
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-3">Personal Information</h4>
                  </div>
                  
                  <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your full name" disabled={!isEditing || updateProfileMutation.isPending}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}/>
                  
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="your.email@example.com" disabled={!isEditing || updateProfileMutation.isPending}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>)}/>
                  
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" disabled={!isEditing || updateProfileMutation.isPending}/>
                        </FormControl>
                        <FormDescription>
                          Used for customer communications and notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>)}/>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Account Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Username</p>
                        <p className="text-sm text-muted-foreground">{user?.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Account Created</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.createdAt && new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                {isEditing && (<CardFooter className="flex justify-end space-x-4 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={updateProfileMutation.isPending}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!form.formState.isDirty || updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? (<>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin"/> 
                          Saving...
                        </>) : (<>
                          <Check className="mr-2 h-4 w-4"/> 
                          Save Changes
                        </>)}
                    </Button>
                  </CardFooter>)}
              </form>
            </Form>
          </Card>
          
          {/* Business Settings Card */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure additional settings for your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h4 className="text-sm font-medium">Business Hours</h4>
                <p className="text-sm text-muted-foreground">
                  Configure your business hours in the slot management section.
                </p>
                <Button variant="outline" className="w-fit mt-2" asChild>
                  <a href="/owner/slots">Manage Time Slots</a>
                </Button>
              </div>
              
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <h4 className="text-sm font-medium">Services</h4>
                <p className="text-sm text-muted-foreground">
                  {services && services.length > 0 ?
            `You currently have ${services?.length} active services.` :
            "You don't have any services set up yet."}
                </p>
                <div className="flex flex-col space-y-2 mt-2">
                  <Button variant="outline" className="w-fit" disabled>
                    Manage Services
                  </Button>
                  <p className="text-xs text-muted-foreground italic">
                    Service management will be available in a future update
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <h4 className="text-sm font-medium">Payment Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Configure how you receive payments from customers.
                </p>
                <Button variant="outline" className="w-fit mt-2" disabled>
                  Payment Settings
                </Button>
                <p className="text-xs text-muted-foreground italic">
                  Payment settings will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>);
}
