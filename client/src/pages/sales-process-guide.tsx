import { FC, useState } from "react";
import { PageTitle } from "@/components/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock, FileText, InfoIcon, Users, Briefcase, Package, Truck, Workflow } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface StepProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  currentStep: number;
  stepNumber: number;
  link?: string;
  linkText?: string;
  role: string;
}

const Step: FC<StepProps> = ({
  title,
  description,
  icon,
  currentStep,
  stepNumber,
  link,
  linkText,
  role,
}) => {
  const isActive = currentStep === stepNumber;
  const isCompleted = currentStep > stepNumber;

  return (
    <div
      className={cn(
        "relative flex items-start p-4 border rounded-lg gap-4",
        isActive && "border-primary bg-primary/5",
        isCompleted && "border-green-500 bg-green-50",
        !isActive && !isCompleted && "border-border"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full w-12 h-12 mt-1 flex-shrink-0",
          isActive && "bg-primary text-primary-foreground",
          isCompleted && "bg-green-500 text-white",
          !isActive && !isCompleted && "bg-muted text-muted-foreground"
        )}
      >
        {isCompleted ? <Check className="h-6 w-6" /> : icon}
      </div>
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-lg">{title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {role}
          </span>
        </div>
        <p className="text-muted-foreground">{description}</p>
        {link && (
          <Button asChild variant="link" className="p-0 h-auto">
            <Link to={link}>
              {linkText || "Go to page"} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 h-full">
        {stepNumber > 1 && (
          <div
            className={cn(
              "absolute top-0 left-4 -translate-y-full h-1/2 w-0.5",
              isCompleted ? "bg-green-500" : "bg-border"
            )}
          />
        )}
        {stepNumber < 10 && (
          <div
            className={cn(
              "absolute bottom-0 left-4 translate-y-full h-1/2 w-0.5",
              isActive || isCompleted ? "bg-green-500" : "bg-border"
            )}
          />
        )}
      </div>
    </div>
  );
};

const ProcessSection: FC<{ title: string; description: string; steps: React.ReactNode }> = ({
  title,
  description,
  steps,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 ml-4">{steps}</div>
      </CardContent>
    </Card>
  );
};

const SalesProcessGuidePage: FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  
  return (
    <div className="container py-6 space-y-6 max-w-5xl">
      <PageTitle title="Sales Process Guide" />
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="prose max-w-none">
          <p>
            This guide outlines the entire order pipeline from lead acquisition to final delivery. 
            Use it to understand each stage of the process, track current orders, and identify pending actions.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visual">
            <Workflow className="mr-2 h-4 w-4" />
            Visual Workflow
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <FileText className="mr-2 h-4 w-4" />
            Detailed Steps
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="visual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Process Workflow</CardTitle>
              <CardDescription>
                Interactive visualization of the order process. Use the slider to see what happens at each stage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentStep}
                  onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Lead Acquisition</span>
                  <span>Order Creation</span>
                  <span>Design</span>
                  <span>Manufacturing</span>
                  <span>Delivery</span>
                </div>
                
                <div className="space-y-6 mt-8 ml-4">
                  <Step
                    title="Lead Claimed from Big Board"
                    description="Salesperson claims a lead from the Big Board, initiating the sales process."
                    icon={<Users className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={1}
                    link="/leads"
                    linkText="Go to Leads"
                    role="Salesperson"
                  />
                  
                  <Step
                    title="Order Creation"
                    description="Salesperson completes the order form with customer and item details."
                    icon={<FileText className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={2}
                    link="/orders"
                    linkText="Go to Orders"
                    role="Salesperson"
                  />
                  
                  <Step
                    title="Design Claim"
                    description="Designer claims the job from the Unclaimed Designs page."
                    icon={<Briefcase className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={3}
                    link="/design-jobs"
                    linkText="Go to Design Jobs"
                    role="Designer"
                  />
                  
                  <Step
                    title="Customer Design Input"
                    description="Customer receives email to provide item-specific design requirements."
                    icon={<InfoIcon className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={4}
                    role="Customer"
                  />
                  
                  <Step
                    title="Design Completion"
                    description="Designer completes front and back mockups for each item within 72 hours."
                    icon={<Clock className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={5}
                    link="/design-jobs"
                    linkText="Go to Design Jobs"
                    role="Designer"
                  />
                  
                  <Step
                    title="Admin Design Approval"
                    description="Admin reviews and approves completed designs."
                    icon={<Check className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={6}
                    link="/admin/design-approvals"
                    linkText="Go to Design Approvals"
                    role="Admin"
                  />
                  
                  <Step
                    title="Size Collection"
                    description="Salesperson requests sizes, customer selects sizes and quantities."
                    icon={<Users className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={7}
                    link="/orders"
                    linkText="Go to Orders"
                    role="Salesperson"
                  />
                  
                  <Step
                    title="Manufacturing Setup"
                    description="Admin assigns manufacturer and attaches fabric/cut details."
                    icon={<Package className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={8}
                    link="/admin/manufacturing-approvals"
                    linkText="Go to Manufacturing Approvals"
                    role="Admin"
                  />
                  
                  <Step
                    title="Production & Shipping"
                    description="Manufacturer completes production and uploads tracking information."
                    icon={<Truck className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={9}
                    link="/manufacturing"
                    linkText="Go to Manufacturing Orders"
                    role="Manufacturer"
                  />
                  
                  <Step
                    title="Order Completion"
                    description="Order is delivered, marked complete, and payouts are generated."
                    icon={<Check className="h-6 w-6" />}
                    currentStep={currentStep}
                    stepNumber={10}
                    role="System"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailed" className="mt-6 space-y-6">
          <ProcessSection
            title="Lead Management & Order Creation"
            description="The initial phase where salespeople engage with leads and create orders"
            steps={
              <>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="font-medium">
                      1. Lead Claimed from Big Board
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          A salesperson claims a lead from the Big Board, which initiates the sales process.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Go to the Leads page</li>
                            <li>Find an unclaimed lead or one assigned to you</li>
                            <li>Click "Claim Lead" or select an existing lead</li>
                            <li>Review lead details and contact information</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/leads">
                              Go to Leads
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="font-medium">
                      2. Order Creation
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          The salesperson fills out a standard order form and adds necessary items.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Create a new order from the lead page or orders page</li>
                            <li>Fill out customer details</li>
                            <li>Add products from the catalog</li>
                            <li>Specify quantities, colors, and any customization notes</li>
                            <li>Submit the order for design</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/orders">
                              Go to Orders
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            }
          />
          
          <ProcessSection
            title="Design Process"
            description="The phase where designers create and refine mockups based on customer requirements"
            steps={
              <>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="font-medium">
                      3. Design Claim
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          Designer claims the job from the Unclaimed Designs page. This initiates the design process.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Designer visits the Unclaimed Designs page</li>
                            <li>Reviews order details and requirements</li>
                            <li>Claims the design job</li>
                            <li>System sends automatic email to customer</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/design-jobs">
                              Go to Design Jobs
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="font-medium">
                      4. Customer Design Input
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          Customer receives an email with a form to provide item-specific design descriptions.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Customer receives automated email</li>
                            <li>Customer fills out design requirements form</li>
                            <li>System notifies designer when form is submitted</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-5">
                    <AccordionTrigger className="font-medium">
                      5. Design Completion
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          Designer completes front and back mockups for each item within 72 hours.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Designer creates mockups based on customer input</li>
                            <li>Designer uploads completed designs to the system</li>
                            <li>Designer submits designs for admin review</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/design-jobs">
                              Go to Design Jobs
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-6">
                    <AccordionTrigger className="font-medium">
                      6. Admin Design Approval
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          Admin reviews and approves the completed designs.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Admin reviews designs on Pending Design Approvals page</li>
                            <li>Admin can approve or request revisions</li>
                            <li>When approved, system notifies salesperson</li>
                            <li>Order is unlocked for size input</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/admin/design-approvals">
                              Go to Design Approvals
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            }
          />
          
          <ProcessSection
            title="Manufacturing & Fulfillment"
            description="The phase where orders are produced, shipped, and completed"
            steps={
              <>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-7">
                    <AccordionTrigger className="font-medium">
                      7. Size Collection
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          Salesperson requests sizes, triggering a form for the customer to select sizes and quantities.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Salesperson clicks "Request Sizes" button</li>
                            <li>System sends automated email to customer</li>
                            <li>Customer fills out size and quantity form</li>
                            <li>Order enters Pending Manufacturing Approval stage</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/orders">
                              Go to Orders
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-8">
                    <AccordionTrigger className="font-medium">
                      8. Manufacturing Setup
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          Admin selects a manufacturer, attaches relevant fabric and product cut details.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Admin reviews order details</li>
                            <li>Selects appropriate manufacturer</li>
                            <li>Attaches fabric and cutting pattern details</li>
                            <li>Pushes order to manufacturer</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/admin/manufacturing-approvals">
                              Go to Manufacturing Approvals
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-9">
                    <AccordionTrigger className="font-medium">
                      9. Production & Shipping
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          Manufacturer completes production and uploads tracking information.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Manufacturer receives complete order details</li>
                            <li>Inputs item costs</li>
                            <li>Updates production status in real-time</li>
                            <li>Uploads tracking information and box contents</li>
                            <li>System notifies salesperson and customer</li>
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/manufacturing">
                              Go to Manufacturing Orders
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-10">
                    <AccordionTrigger className="font-medium">
                      10. Order Completion
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-4">
                        <p>
                          Order is delivered, marked complete, archived, and payouts are generated.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="font-medium mb-2">Key Actions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>System confirms delivery based on tracking</li>
                            <li>Order is marked as complete</li>
                            <li>Order is archived for reference</li>
                            <li>System generates payouts to salesperson, designer, and manufacturer</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            }
          />
        </TabsContent>
      </Tabs>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4">Get Help With Sales Process</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Training Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access detailed training documents and videos about the sales process.
              </p>
              <Button variant="outline" className="mt-2 w-full">
                View Training Materials
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Need help with a specific order or process? Contact our support team.
              </p>
              <Button variant="outline" className="mt-2 w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesProcessGuidePage;