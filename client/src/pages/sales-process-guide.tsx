import React, { useState } from "react";
import PageTitle from "../components/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  CheckCircle2,
  ClipboardList,
  Factory,
  FileText,
  PenTool,
  Phone,
  User,
  Users,
  ShoppingCart,
  Truck,
  MessageSquare,
  CreditCard
} from "lucide-react";

// Status badges for the sales process
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "admin":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Admin</Badge>;
    case "sales":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sales</Badge>;
    case "design":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Design</Badge>;
    case "manufacturing":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Manufacturing</Badge>;
    case "customer":
      return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">Customer</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Process step component
const ProcessStep = ({ 
  number, 
  title, 
  description, 
  icon, 
  status, 
  route 
}: { 
  number: number, 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  status: string, 
  route?: string 
}) => {
  return (
    <Card className="mb-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 left-0 h-full w-1 bg-brand-500"></div>
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          {icon}
        </div>
        <div className="grid gap-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <span>{title}</span>
            <StatusBadge status={status} />
          </CardTitle>
          <CardDescription>Step {number}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{description}</p>
        {route && (
          <Button variant="outline" size="sm" className="mt-2" asChild>
            <Link href={route}>Go to {title}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Main sales process guide component
export default function SalesProcessGuide() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Define the stages for the tabs
  const stages = [
    { id: "lead-acquisition", name: "Lead Acquisition" },
    { id: "order-creation", name: "Order Creation" },
    { id: "design-process", name: "Design Process" },
    { id: "manufacturing", name: "Manufacturing" },
    { id: "delivery", name: "Delivery & Follow-up" }
  ];

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <PageTitle 
        title="Sales Process Guide" 
        subtitle="A step-by-step overview of the entire workflow from lead to delivery" 
      />
      
      <Tabs defaultValue="lead-acquisition" className="mb-6">
        <TabsList className="mb-4 grid w-full grid-cols-2 md:grid-cols-5">
          {stages.map((stage) => (
            <TabsTrigger key={stage.id} value={stage.id}>{stage.name}</TabsTrigger>
          ))}
        </TabsList>
        
        {/* Lead Acquisition Tab */}
        <TabsContent value="lead-acquisition">
          <div className="grid gap-6">
            <div className="prose max-w-none mb-6">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Lead Acquisition Process</h2>
              <p className="text-gray-600">
                The first stage of our sales process involves the collection and management of new leads. 
                This process is primarily managed by the Admin team who oversee the initial intake before 
                leads are assigned to or claimed by Sales Representatives.
              </p>
            </div>
            
            <ProcessStep
              number={1}
              title="Lead Collection"
              description="Admin collects leads from various sources (website inquiries, phone calls, referrals, etc.) and enters them into the system with contact details and initial requirements."
              icon={<ClipboardList className="h-5 w-5" />}
              status="admin"
              route="/leads"
            />
            
            <ProcessStep
              number={2}
              title="Lead Assignment"
              description="Admin assigns leads to appropriate sales representatives based on territory, expertise, or workload. Alternatively, sales representatives can claim open leads from the pool."
              icon={<Users className="h-5 w-5" />}
              status="admin"
              route="/leads"
            />
            
            <ProcessStep
              number={3}
              title="Initial Contact"
              description="Sales representative makes initial contact with the lead via phone or email to validate interest, gather requirements, and schedule a consultation if appropriate."
              icon={<Phone className="h-5 w-5" />}
              status="sales"
              route="/outlook"
            />
            
            <ProcessStep
              number={4}
              title="Lead Qualification"
              description="Sales representative evaluates the lead's needs, timeline, and budget to determine if they are a good fit for our products and services."
              icon={<CheckCircle2 className="h-5 w-5" />}
              status="sales"
              route="/leads"
            />
          </div>
        </TabsContent>
        
        {/* Order Creation Tab */}
        <TabsContent value="order-creation">
          <div className="grid gap-6">
            <div className="prose max-w-none mb-6">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Order Creation Process</h2>
              <p className="text-gray-600">
                Once a lead has been qualified, the sales representative works with the customer to 
                create an order. This involves selecting products, finalizing specifications, and 
                documenting customer requirements.
              </p>
            </div>
            
            <ProcessStep
              number={5}
              title="Product Selection"
              description="Sales representative helps the customer select appropriate products from the catalog based on their requirements and preferences."
              icon={<ShoppingCart className="h-5 w-5" />}
              status="sales"
              route="/catalog"
            />
            
            <ProcessStep
              number={6}
              title="Specification Collection"
              description="Sales representative collects detailed specifications including dimensions, materials, colors, and any custom requirements the customer may have."
              icon={<FileText className="h-5 w-5" />}
              status="sales"
              route="/orders"
            />
            
            <ProcessStep
              number={7}
              title="Quote Generation"
              description="Based on the selected products and specifications, a detailed quote is generated including pricing, estimated timelines, and terms of delivery."
              icon={<CreditCard className="h-5 w-5" />}
              status="sales"
              route="/orders"
            />
            
            <ProcessStep
              number={8}
              title="Order Confirmation"
              description="Once the customer approves the quote, the sales representative finalizes the order in the system and collects any required deposits or payments."
              icon={<CheckCircle2 className="h-5 w-5" />}
              status="sales"
              route="/orders"
            />
          </div>
        </TabsContent>
        
        {/* Design Process Tab */}
        <TabsContent value="design-process">
          <div className="grid gap-6">
            <div className="prose max-w-none mb-6">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Design Process</h2>
              <p className="text-gray-600">
                After an order is confirmed, the design team takes over to create detailed designs 
                and specifications based on the customer's requirements. This phase involves multiple 
                reviews and approvals.
              </p>
            </div>
            
            <ProcessStep
              number={9}
              title="Design Assignment"
              description="The design manager assigns the order to an appropriate designer based on expertise, current workload, and the specific requirements of the project."
              icon={<User className="h-5 w-5" />}
              status="design"
              route="/design"
            />
            
            <ProcessStep
              number={10}
              title="Initial Design Creation"
              description="Designer creates initial design concepts and detailed specifications based on the sales order and customer requirements."
              icon={<PenTool className="h-5 w-5" />}
              status="design"
              route="/design"
            />
            
            <ProcessStep
              number={11}
              title="Design Review"
              description="The completed design is reviewed internally before being presented to the customer to ensure it meets quality standards and accurately reflects the order specifications."
              icon={<CheckCircle2 className="h-5 w-5" />}
              status="design"
              route="/design-communication"
            />
            
            <ProcessStep
              number={12}
              title="Customer Approval"
              description="The design is presented to the customer for review and approval. Any requested changes are noted and implemented in design revisions."
              icon={<MessageSquare className="h-5 w-5" />}
              status="customer"
              route="/design-communication"
            />
            
            <ProcessStep
              number={13}
              title="Final Design Preparation"
              description="After customer approval, the designer finalizes the design and prepares all necessary documentation and specifications for manufacturing."
              icon={<FileText className="h-5 w-5" />}
              status="design"
              route="/design"
            />
          </div>
        </TabsContent>
        
        {/* Manufacturing Tab */}
        <TabsContent value="manufacturing">
          <div className="grid gap-6">
            <div className="prose max-w-none mb-6">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Manufacturing Process</h2>
              <p className="text-gray-600">
                With approved designs in hand, the manufacturing team begins production. This stage 
                involves scheduling, material procurement, production, quality control, and preparation 
                for delivery.
              </p>
            </div>
            
            <ProcessStep
              number={14}
              title="Production Planning"
              description="The manufacturing team schedules the production run, orders necessary materials, and allocates resources based on the design specifications and required delivery dates."
              icon={<ClipboardList className="h-5 w-5" />}
              status="manufacturing"
              route="/manufacturing"
            />
            
            <ProcessStep
              number={15}
              title="Material Procurement"
              description="All necessary materials are procured according to the design specifications, ensuring quality standards are met and delivery timelines can be achieved."
              icon={<ShoppingCart className="h-5 w-5" />}
              status="manufacturing"
              route="/manufacturing"
            />
            
            <ProcessStep
              number={16}
              title="Production"
              description="The actual manufacturing process begins, with progress tracked at each stage to ensure quality and adherence to specifications."
              icon={<Factory className="h-5 w-5" />}
              status="manufacturing"
              route="/manufacturing"
            />
            
            <ProcessStep
              number={17}
              title="Quality Control"
              description="Completed products undergo rigorous quality control checks to ensure they meet all specifications and quality standards before being approved for delivery."
              icon={<CheckCircle2 className="h-5 w-5" />}
              status="manufacturing"
              route="/production-communication"
            />
            
            <ProcessStep
              number={18}
              title="Packaging and Preparation"
              description="Approved products are carefully packaged for shipping, with all necessary documentation prepared for delivery."
              icon={<Truck className="h-5 w-5" />}
              status="manufacturing"
              route="/manufacturing"
            />
          </div>
        </TabsContent>
        
        {/* Delivery Tab */}
        <TabsContent value="delivery">
          <div className="grid gap-6">
            <div className="prose max-w-none mb-6">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Delivery & Follow-up Process</h2>
              <p className="text-gray-600">
                The final stage of our sales process involves coordinating delivery, installation 
                if necessary, collecting customer feedback, and ensuring overall satisfaction with 
                the product and service.
              </p>
            </div>
            
            <ProcessStep
              number={19}
              title="Delivery Scheduling"
              description="The sales representative coordinates with the customer and delivery team to schedule a convenient delivery time and location."
              icon={<ClipboardList className="h-5 w-5" />}
              status="sales"
              route="/orders"
            />
            
            <ProcessStep
              number={20}
              title="Product Delivery"
              description="Products are delivered to the customer according to the agreed schedule, with delivery confirmation recorded in the system."
              icon={<Truck className="h-5 w-5" />}
              status="manufacturing"
              route="/manufacturing"
            />
            
            <ProcessStep
              number={21}
              title="Installation (if applicable)"
              description="For products requiring installation, our team coordinates and performs the installation according to specifications."
              icon={<CheckCircle2 className="h-5 w-5" />}
              status="manufacturing"
              route="/manufacturing"
            />
            
            <ProcessStep
              number={22}
              title="Customer Feedback"
              description="After delivery and installation, the sales representative contacts the customer to gather feedback on the product and overall experience."
              icon={<MessageSquare className="h-5 w-5" />}
              status="sales"
              route="/feedback"
            />
            
            <ProcessStep
              number={23}
              title="Follow-up and Retention"
              description="The sales representative maintains regular contact with the customer to ensure ongoing satisfaction and identify opportunities for additional sales or referrals."
              icon={<Users className="h-5 w-5" />}
              status="sales"
              route="/outlook"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}