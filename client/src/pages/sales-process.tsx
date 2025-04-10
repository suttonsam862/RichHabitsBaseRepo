import Layout from "@/components/layout";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, CheckCircle, Users, Package, PenTool, Factory, CheckCheck, BarChart3, PlusCircle, Edit, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";

export default function SalesProcessPage() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <Layout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Process Guide</h1>
            <p className="text-muted-foreground">
              Learn how to navigate the Rich Habits Dashboard and manage your workflow
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Managing Leads</TabsTrigger>
            <TabsTrigger value="orders">Processing Orders</TabsTrigger>
            <TabsTrigger value="design">Design Workflow</TabsTrigger>
            <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="mr-2 h-5 w-5 text-blue-500" />
                    Complete Sales Process Workflow
                  </CardTitle>
                  <CardDescription>
                    The Rich Habits Dashboard orchestrates a complete workflow from lead collection to product delivery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mt-6">
                    <div className="absolute top-0 left-6 h-full w-px bg-border"></div>
                    
                    <div className="grid gap-8">
                      <div className="relative flex">
                        <div className="absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="ml-20">
                          <h3 className="text-lg font-semibold">Step 1: Lead Collection and Assignment</h3>
                          <p className="text-muted-foreground">
                            Admin collects new leads and enters them into the system. Leads can be assigned to sales reps
                            or claimed by sales reps with a 3-day verification period.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setLocation("/leads")}
                          >
                            Go to Leads
                          </Button>
                        </div>
                      </div>

                      <div className="relative flex">
                        <div className="absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className="ml-20">
                          <h3 className="text-lg font-semibold">Step 2: Lead Verification and Order Creation</h3>
                          <p className="text-muted-foreground">
                            Once a lead is verified (after 3 days or with admin approval), the sales rep can convert the lead
                            to an order, specifying products, quantities, and design requirements.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setLocation("/orders")}
                          >
                            Go to Orders
                          </Button>
                        </div>
                      </div>

                      <div className="relative flex">
                        <div className="absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <PenTool className="h-6 w-6" />
                        </div>
                        <div className="ml-20">
                          <h3 className="text-lg font-semibold">Step 3: Design Process</h3>
                          <p className="text-muted-foreground">
                            Design team receives design requests from orders, creates mockups, and collaborates with
                            customers and sales reps for approvals and revisions.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setLocation("/design")}
                          >
                            Go to Design
                          </Button>
                        </div>
                      </div>

                      <div className="relative flex">
                        <div className="absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <Factory className="h-6 w-6" />
                        </div>
                        <div className="ml-20">
                          <h3 className="text-lg font-semibold">Step 4: Manufacturing</h3>
                          <p className="text-muted-foreground">
                            Once designs are approved, production details are sent to manufacturing partners
                            who update order status through completion.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setLocation("/manufacturing")}
                          >
                            Go to Manufacturing
                          </Button>
                        </div>
                      </div>

                      <div className="relative flex">
                        <div className="absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        <div className="ml-20">
                          <h3 className="text-lg font-semibold">Step 5: Order Fulfillment and Tracking</h3>
                          <p className="text-muted-foreground">
                            Track order progress, shipping details, and fulfillment status. Generate reports
                            and analyze sales performance data.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setLocation("/dashboard")}
                          >
                            Go to Dashboard
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Role Permissions</CardTitle>
                  <CardDescription>
                    Different user roles have different access levels and permissions throughout the workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="bg-secondary p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Admin</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Full access to all features and data across the platform.
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Create and manage users with different roles</li>
                        <li>View and edit all leads, orders, designs, and manufacturing details</li>
                        <li>Bypass verification periods for lead claims</li>
                        <li>Access analytics and reporting across all sales reps</li>
                        <li>Configure system settings and integrations</li>
                      </ul>
                    </div>

                    <div className="bg-secondary p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Sales Representatives</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Access to leads, orders, and communication features.
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>View assigned leads and open leads</li>
                        <li>Claim leads (with 3-day verification period)</li>
                        <li>Convert verified leads to orders</li>
                        <li>Create and manage organizations</li>
                        <li>Communicate with design team and customers</li>
                        <li>View order status and progress</li>
                      </ul>
                    </div>

                    <div className="bg-secondary p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Design Team</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Access to design projects and communication tools.
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>View and claim design projects</li>
                        <li>Upload design mockups and revisions</li>
                        <li>Communicate with sales reps and customers</li>
                        <li>Track design approvals and changes</li>
                      </ul>
                    </div>

                    <div className="bg-secondary p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Manufacturing Partners</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Access to production details and status updates.
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>View approved orders ready for production</li>
                        <li>Update order status and production timeline</li>
                        <li>Communicate production issues or questions</li>
                        <li>Mark orders as complete when fulfilled</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LEADS TAB */}
          <TabsContent value="leads" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5 text-green-500" />
                    Creating New Leads
                  </CardTitle>
                  <CardDescription>
                    Learn how to add new leads to the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 1: Navigate to Leads Page</h3>
                      <p className="text-muted-foreground mb-2">
                        Access the Leads page from the sidebar navigation or dashboard.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/lead-step1.png" 
                          alt="Navigate to Leads" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Navigate+to+Leads";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 2: Click "Add New Lead"</h3>
                      <p className="text-muted-foreground mb-2">
                        Click the "Add New Lead" button on the Leads page to open the lead creation form.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/lead-step2.png" 
                          alt="Add New Lead Button" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Add+New+Lead+Button";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 3: Complete Lead Details</h3>
                      <p className="text-muted-foreground mb-2">
                        Fill out the required information for the new lead. Required fields include name, email, and source.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/lead-step3.png" 
                          alt="Fill Lead Form" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Fill+Lead+Form";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 4: Submit New Lead</h3>
                      <p className="text-muted-foreground mb-2">
                        Click "Submit" to create the lead. The system will automatically create an organization record if one does not exist.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/lead-step4.png" 
                          alt="Submit Lead" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Submit+Lead";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-blue-500" />
                    Claiming Leads
                  </CardTitle>
                  <CardDescription>
                    How to claim leads and convert them to orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 1: Find Available Leads</h3>
                      <p className="text-muted-foreground mb-2">
                        Sales representatives can view open leads in the "Open Leads" tab of the Leads page.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/claim-step1.png" 
                          alt="Open Leads Tab" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Open+Leads+Tab";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 2: Click "Claim Lead"</h3>
                      <p className="text-muted-foreground mb-2">
                        Find the desired lead and click the "Claim Lead" button to initiate the claim process.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/claim-step2.png" 
                          alt="Claim Lead Button" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Claim+Lead+Button";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 3: Verification Period</h3>
                      <p className="text-muted-foreground mb-2">
                        After claiming a lead, there is a 3-day verification period before it can be converted to an order.
                        Admin users can bypass this period.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/claim-step3.png" 
                          alt="Verification Period" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Verification+Period";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 4: Convert to Order</h3>
                      <p className="text-muted-foreground mb-2">
                        After the verification period or with admin approval, the "Convert to Order" button will become active,
                        allowing the lead to be converted to an order.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/claim-step4.png" 
                          alt="Convert to Order" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Convert+to+Order";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5 text-purple-500" />
                    Creating and Managing Orders
                  </CardTitle>
                  <CardDescription>
                    How to create orders and add products and customizations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 1: Convert Lead to Order</h3>
                      <p className="text-muted-foreground mb-2">
                        After claiming and verifying a lead, click "Convert to Order" to create a new order.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/order-step1.png" 
                          alt="Convert to Order" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Convert+to+Order";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 2: Add Products to Order</h3>
                      <p className="text-muted-foreground mb-2">
                        In the order details, click "Add Product" to select products from the catalog and specify quantities and sizes.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/order-step2.png" 
                          alt="Add Products" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Add+Products";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 3: Specify Customizations</h3>
                      <p className="text-muted-foreground mb-2">
                        Add customization details such as colors, logos, and special instructions for each product.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/order-step3.png" 
                          alt="Specify Customizations" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Specify+Customizations";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 4: Submit Design Request</h3>
                      <p className="text-muted-foreground mb-2">
                        Once products and customizations are added, click "Submit Design Request" to send the order to the design team.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/order-step4.png" 
                          alt="Submit Design Request" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Submit+Design+Request";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="mr-2 h-5 w-5 text-indigo-500" />
                    Tracking Order Progress
                  </CardTitle>
                  <CardDescription>
                    How to monitor the progress of orders through the workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Viewing Order Status</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-4">
                          Orders go through multiple statuses as they progress through the workflow:
                        </p>
                        <ul className="space-y-2 ml-2">
                          <li className="flex items-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 mr-2">
                              <PlusCircle className="h-4 w-4" />
                            </span>
                            <span><strong>New:</strong> Order has been created but not yet submitted for design</span>
                          </li>
                          <li className="flex items-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 mr-2">
                              <PenTool className="h-4 w-4" />
                            </span>
                            <span><strong>Design Requested:</strong> Order has been submitted to the design team</span>
                          </li>
                          <li className="flex items-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 mr-2">
                              <Clock className="h-4 w-4" />
                            </span>
                            <span><strong>Design In Progress:</strong> Designers are working on mockups</span>
                          </li>
                          <li className="flex items-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700 mr-2">
                              <CheckCircle className="h-4 w-4" />
                            </span>
                            <span><strong>Design Approved:</strong> Designs have been approved by the customer</span>
                          </li>
                          <li className="flex items-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-700 mr-2">
                              <Factory className="h-4 w-4" />
                            </span>
                            <span><strong>In Production:</strong> Order is being manufactured</span>
                          </li>
                          <li className="flex items-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 mr-2">
                              <Package className="h-4 w-4" />
                            </span>
                            <span><strong>Shipped:</strong> Order has been shipped to the customer</span>
                          </li>
                          <li className="flex items-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700 mr-2">
                              <CheckCheck className="h-4 w-4" />
                            </span>
                            <span><strong>Delivered:</strong> Order has been received by the customer</span>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Managing Order Changes</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-4">
                          To make changes to an existing order:
                        </p>
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Navigate to the Orders page</li>
                          <li>Find the order you want to modify</li>
                          <li>Click "View Details" to open the order</li>
                          <li>Use the "Edit" button to make changes to order details</li>
                          <li>Add or remove products using the product management buttons</li>
                          <li>Save changes when complete</li>
                        </ol>
                        <p className="text-sm mt-4 text-amber-600">
                          <strong>Note:</strong> Changes to orders in production may incur additional fees and delay delivery.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* DESIGN TAB */}
          <TabsContent value="design" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PenTool className="mr-2 h-5 w-5 text-purple-500" />
                    Design Workflow
                  </CardTitle>
                  <CardDescription>
                    How to manage design projects and approvals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 1: View Design Projects</h3>
                      <p className="text-muted-foreground mb-2">
                        Navigate to the Design page to view all available design projects. Designers can claim unassigned projects.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/design-step1.png" 
                          alt="View Design Projects" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=View+Design+Projects";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 2: Upload Design Mockups</h3>
                      <p className="text-muted-foreground mb-2">
                        Upload design mockups for customer review using the file upload tool.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/design-step2.png" 
                          alt="Upload Mockups" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Upload+Mockups";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 3: Manage Revisions</h3>
                      <p className="text-muted-foreground mb-2">
                        Process revision requests from customers and sales reps, tracking all changes in the revision history.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/design-step3.png" 
                          alt="Manage Revisions" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Manage+Revisions";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 4: Finalize Design</h3>
                      <p className="text-muted-foreground mb-2">
                        Once the customer approves a design, finalize it and mark the design project as complete.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/design-step4.png" 
                          alt="Finalize Design" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Finalize+Design";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MANUFACTURING TAB */}
          <TabsContent value="manufacturing" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Factory className="mr-2 h-5 w-5 text-orange-500" />
                    Manufacturing Process
                  </CardTitle>
                  <CardDescription>
                    How to manage production and fulfillment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 1: View Production Orders</h3>
                      <p className="text-muted-foreground mb-2">
                        Manufacturing partners can view orders that are ready for production in the Manufacturing dashboard.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/manufacturing-step1.png" 
                          alt="Production Orders" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Production+Orders";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 2: Update Production Status</h3>
                      <p className="text-muted-foreground mb-2">
                        Update the status of orders as they progress through the manufacturing process.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/manufacturing-step2.png" 
                          alt="Update Status" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Update+Status";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 3: Record Shipping Information</h3>
                      <p className="text-muted-foreground mb-2">
                        When orders are ready to ship, add tracking numbers and shipping details.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/manufacturing-step3.png" 
                          alt="Shipping Information" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Shipping+Information";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Step 4: Mark Order as Complete</h3>
                      <p className="text-muted-foreground mb-2">
                        Once an order has been delivered to the customer, mark it as complete in the system.
                      </p>
                      <div className="border rounded-md p-4 bg-muted">
                        <img 
                          src="/manufacturing-step4.png" 
                          alt="Complete Order" 
                          className="rounded-md border shadow-sm mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Complete+Order";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}