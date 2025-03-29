import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
const waitlistSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    businessType: z.string().optional(),
    userType: z.enum(["business-owner", "customer"], {
        required_error: "Please select a user type"
    }),
    newsletter: z.boolean().default(false)
});
export default function Waitlist() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(waitlistSchema),
        defaultValues: {
            fullName: "",
            email: "",
            businessType: "",
            userType: "business-owner",
            newsletter: false
        }
    });
    const onSubmit = async (data) => {
        try {
            await apiRequest("POST", "/api/waitlist", data);
            setIsSubmitted(true);
            toast({
                title: "Success!",
                description: "Thank you for joining our waitlist! We'll notify you when BookEasy launches.",
            });
        }
        catch (error) {
            toast({
                title: "Submission failed",
                description: error instanceof Error ? error.message : "Failed to join waitlist",
                variant: "destructive",
            });
        }
    };
    return (<section id="waitlist" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-base font-semibold text-primary uppercase tracking-wide">Waitlist</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-4xl">Be the first to know</p>
          <p className="mt-5 text-xl text-gray-500">Join our waitlist to get early access and exclusive benefits when we launch.</p>
        </div>

        <div className="mt-12 max-w-md mx-auto">
          {isSubmitted ? (<div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-400"/>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Thank you for joining our waitlist! We'll notify you when BookEasy launches.</p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <Button variant="outline" className="bg-green-50 text-green-800 hover:bg-green-100">
                        Share on Twitter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>) : (<Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-y-6">
                <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="email" render={({ field }) => (<FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@example.com" {...field}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="businessType" render={({ field }) => (<FormItem>
                      <FormLabel>Business type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a business type"/>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="select">Select a business type</SelectItem>
                          <SelectItem value="salon">Salon / Spa</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="fitness">Fitness / Gym</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="professional">Professional Services</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="userType" render={({ field }) => (<FormItem className="space-y-3">
                      <FormLabel>I am a</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="business-owner" id="business-owner"/>
                            <label htmlFor="business-owner" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Business owner
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="customer" id="customer"/>
                            <label htmlFor="customer" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Customer looking to use the platform
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="newsletter" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I'd like to receive updates about product features and launch details.
                        </FormLabel>
                      </div>
                    </FormItem>)}/>

                <Button type="submit" className="w-full">
                  Join Waitlist
                </Button>
              </form>
            </Form>)}
        </div>
      </div>
    </section>);
}
