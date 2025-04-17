import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useParams } from "wouter/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, ChevronLeft, CalendarClock, Users, Clipboard, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  tierId: z.coerce.number().int().positive("Please select a registration tier"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
  weightClass: z.string().optional(),
  shirtSize: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  allergies: z.string().optional(),
  specialRequirements: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
});

// Form component
function RegistrationForm() {
  const { campId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get camp details
  const { data: camp, isLoading: isLoadingCamp } = useQuery({
    queryKey: ['/api/camps', campId],
    enabled: !!campId,
  });
  
  // Get registration tiers
  const { data: tiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ['/api/camp', campId, 'registration-tiers'],
    enabled: !!campId,
  });
  
  // Form setup
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      tierId: undefined,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      dateOfBirth: "",
      gender: "",
      school: "",
      grade: "",
      weightClass: "",
      shirtSize: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      allergies: "",
      specialRequirements: "",
      agreeToTerms: false,
    },
  });
  
  // Submit registration
  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest(
        "POST", 
        `/api/camp/${campId}/registrations`,
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: "Your registration has been submitted successfully.",
      });
      
      // Redirect to thank you page or registration details
      setLocation(`/events/registration/${campId}`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/camp', campId, 'registrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data) => {
    // Remove non-API fields
    const { agreeToTerms, ...apiData } = data;
    
    // Add source field
    apiData.source = "web";
    apiData.campId = parseInt(campId as string);
    
    registerMutation.mutate(apiData);
  };
  
  // Loading state
  if (isLoadingCamp || isLoadingTiers) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If camp doesn't exist
  if (!camp || !tiers) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/events/overview">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Camps
            </Link>
          </Button>
        </div>
        
        <Card className="mx-auto max-w-md text-center p-6">
          <CardHeader>
            <CardTitle>Camp Not Found</CardTitle>
            <CardDescription>
              The camp you are looking for doesn't exist or registration is not available.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/events/overview">View Available Camps</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const { data: campData } = camp;
  const { data: tiersData } = tiers;
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/events/overview">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Camps
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{campData?.name} Registration</h1>
            <p className="text-muted-foreground mt-1">
              Complete the form below to register for this camp
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Registration Tier Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Registration Tier
                  </CardTitle>
                  <CardDescription>
                    Select the appropriate registration package
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tierId"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Registration Package*</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                              className="space-y-3"
                            >
                              {tiersData?.map((tier) => (
                                <div key={tier.id} className={`
                                  flex items-start space-x-2 p-4 rounded-md border
                                  ${field.value === tier.id ? 'border-primary bg-primary-foreground/5' : 'border-input'}
                                `}>
                                  <RadioGroupItem value={tier.id.toString()} id={`tier-${tier.id}`} className="mt-1" />
                                  <div className="grid gap-1.5 leading-none w-full">
                                    <div className="flex items-center justify-between">
                                      <label
                                        htmlFor={`tier-${tier.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {tier.name}
                                      </label>
                                      <p className="text-sm font-semibold">{formatCurrency(tier.price)}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {tier.description}
                                    </p>
                                    {tier.features && (
                                      <ul className="text-sm mt-2 space-y-1">
                                        {tier.features.map((feature, idx) => (
                                          <li key={idx} className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            <span>{feature}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
                
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Participant Information
                  </CardTitle>
                  <CardDescription>
                    Enter participant's personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email*</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clipboard className="h-5 w-5 text-primary" />
                    Additional Information
                  </CardTitle>
                  <CardDescription>
                    Complete participant's additional details for the camp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="school"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weightClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight Class</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shirtSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shirt Size</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select shirt size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="XS">XS</SelectItem>
                                <SelectItem value="S">S</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="XL">XL</SelectItem>
                                <SelectItem value="XXL">XXL</SelectItem>
                                <SelectItem value="XXXL">XXXL</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Emergency & Health Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Emergency & Health Information</CardTitle>
                  <CardDescription>
                    Provide emergency contact and health information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any allergies or 'None' if none"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="specialRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requirements</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any special requirements, dietary restrictions, etc."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Terms & Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg text-sm max-h-[200px] overflow-y-auto">
                      <h4 className="font-medium mb-2">Participation Agreement, Release, and Acknowledgment of Risk</h4>
                      <p className="mb-2">
                        I hereby agree to participate in the camp activities offered by Rich Habits. I acknowledge that participation in this camp involves certain risks, including but not limited to physical injury.
                      </p>
                      <p className="mb-2">
                        I voluntarily agree to assume all risks involved in participating in this camp and hereby release Rich Habits, its employees, volunteers, and all other persons associated with the camp from any liability for injuries or damages that may occur as a result of my participation.
                      </p>
                      <p className="mb-2">
                        I understand that I am responsible for having appropriate health and accident insurance coverage while participating in camp activities.
                      </p>
                      <p className="mb-2">
                        I grant permission for the camp staff to authorize medical care for me if necessary and if unable to reach the emergency contact person.
                      </p>
                      <p>
                        By checking the box below, I acknowledge that I have read, understood, and agree to these terms and conditions.
                      </p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the terms and conditions*
                            </FormLabel>
                            <FormDescription>
                              You must accept the terms and conditions to complete registration.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation(`/events/overview`)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Complete Registration
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
        
        {/* Camp Information Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6 sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle>{campData?.name}</CardTitle>
                <CardDescription>Camp Information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <CalendarClock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(campData?.startDate)} - {formatDate(campData?.endDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {campData?.type || 'Sports Camp'}
                    </p>
                  </div>
                </div>
                
                {campData?.venue && (
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-medium">Venue</p>
                      <p className="text-sm text-muted-foreground">
                        {campData.venue}
                        {campData.address && (
                          <>
                            <br />
                            {campData.address}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="pt-2">
                  <p className="font-medium mb-1">Camp Status</p>
                  <Badge 
                    className={`
                      ${campData?.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                      campData?.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}
                    `} 
                    variant="outline"
                  >
                    {campData?.status?.charAt(0).toUpperCase() + campData?.status?.slice(1) || 'Upcoming'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Registration Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  Complete the registration form to secure your spot in this camp. 
                  You'll receive a confirmation email after your registration is processed.
                </p>
                
                <div className="text-sm space-y-2">
                  <p className="font-medium">Registration Includes:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Access to all camp sessions</li>
                    <li>Camp t-shirt (if applicable)</li>
                    <li>Training materials</li>
                    <li>Certificate of completion</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="text-sm">
                  <p className="font-medium mb-1">Need Help?</p>
                  <p>
                    If you have any questions about registration, please contact us at {" "}
                    <a href="mailto:camps@rich-habits.com" className="text-primary underline">
                      camps@rich-habits.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;