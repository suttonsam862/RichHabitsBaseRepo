import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  TruckIcon,
  DollarSign,
  Package,
  ArrowRight,
  ClipboardList,
  User,
  Ruler,
  Hammer,
  Scissors,
  ArrowDown,
  CheckSquare,
  FileText,
  Sparkles,
  AlertCircle,
  BoxIcon,
  Share2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Process step component
interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  linkUrl?: string;
  linkText?: string;
}

const ProcessStep = ({ number, title, description, icon, color, linkUrl, linkText }: ProcessStepProps) => (
  <div className="flex">
    <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${color} text-white font-bold mr-4`}>
      {number}
    </div>
    <div className="flex-grow">
      <div className="flex items-center mb-2">
        {icon}
        <h3 className="text-lg font-medium ml-2">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
      
      {linkUrl && linkText && (
        <div className="mt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={linkUrl}>
              {linkText} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  </div>
);

export default function ManufacturingGuide() {
  const { user } = useAuth();
  const isManufacturer = user?.role === "manufacturer";
  
  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Manufacturing Process Guide</h1>
        <p className="text-xl text-gray-600">
          A complete walkthrough of the manufacturing workflow
        </p>
      </div>
      
      {/* Introduction card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Welcome to the Manufacturing Platform</CardTitle>
          <CardDescription>
            This guide will walk you through the complete process of managing production orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-gray-600">
            <p>
              As a manufacturing partner, you're responsible for producing high-quality items to customer specifications.
              This guide explains the workflow from receiving orders to shipping completed products.
            </p>
            <div className="bg-primary/10 p-4 rounded-md">
              <p className="font-medium text-primary">Key things to remember:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>Always meet production deadlines and communicate any potential delays</li>
                <li>Ensure accurate cost reporting for all orders</li>
                <li>Follow all design specifications exactly</li>
                <li>Quality control should be performed before marking any order as "Ready to Ship"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Manufacturing Process Steps */}
      <Card>
        <CardHeader>
          <CardTitle>The Manufacturing Process</CardTitle>
          <CardDescription>
            Follow these steps for each production order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-10 mt-4">
            <ProcessStep
              number={1}
              title="Receive New Orders"
              description="Check your dashboard and manufacturing orders page for new assignments. Review all order details thoroughly before accepting."
              icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
              color="bg-blue-500"
              linkUrl="/manufacturing-orders"
              linkText="View Orders"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={2}
              title="Cost Input"
              description="Enter all production costs for accurate tracking and budgeting. This should be done for each order before beginning production."
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              color="bg-green-500"
              linkUrl="/cost-input"
              linkText="Input Costs"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={3}
              title="Production Process"
              description="Execute the manufacturing process according to design specifications. Regularly update the production status of each order."
              icon={<Hammer className="h-5 w-5 text-amber-500" />}
              color="bg-amber-500"
              linkUrl="/status-update"
              linkText="Update Status"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={4}
              title="Quality Control"
              description="Perform thorough quality checks on all finished products before marking them as ready to ship."
              icon={<CheckSquare className="h-5 w-5 text-violet-500" />}
              color="bg-violet-500"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={5}
              title="Prepare for Shipping"
              description="Package products securely and prepare all shipping documentation according to the specified shipping method."
              icon={<BoxIcon className="h-5 w-5 text-indigo-500" />}
              color="bg-indigo-500"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={6}
              title="Shipping & Tracking"
              description="Ship the completed order and enter all tracking information into the system to update the customer and sales team."
              icon={<TruckIcon className="h-5 w-5 text-purple-500" />}
              color="bg-purple-500"
              linkUrl="/shipping"
              linkText="Complete Shipping"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Manufacturing Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Important Requirements</CardTitle>
          <CardDescription>
            Essential criteria for all manufacturing processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Ruler className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Specification Accuracy</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600">
                    <li>• Follow all measurements precisely</li>
                    <li>• Use specified materials only</li>
                    <li>• Match design colors exactly</li>
                    <li>• Maintain consistent quality standards</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Scissors className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">Production Techniques</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600">
                    <li>• Use appropriate production methods</li>
                    <li>• Document any technique substitutions</li>
                    <li>• Follow established quality procedures</li>
                    <li>• Optimize material usage</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Timeline Adherence</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600">
                    <li>• Meet all production deadlines</li>
                    <li>• Report potential delays immediately</li>
                    <li>• Update production status regularly</li>
                    <li>• Prioritize orders by deadline</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Share2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Communication</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600">
                    <li>• Respond promptly to all inquiries</li>
                    <li>• Document all production issues</li>
                    <li>• Provide detailed notes with shipments</li>
                    <li>• Use appropriate communication channels</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Production Issue Handling */}
      <Card>
        <CardHeader>
          <CardTitle>Handling Production Issues</CardTitle>
          <CardDescription>
            Guidelines for addressing common manufacturing challenges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-red-800">Material Shortages</h3>
                  <p className="text-sm text-red-700 mt-1">
                    If you encounter material shortages, immediately notify the Rich Habits team. Do not substitute materials without explicit approval. 
                    Document any potential impact on production timeline.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-amber-800">Production Delays</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    If production falls behind schedule, update the order status immediately and provide a revised timeline. 
                    Contact the Rich Habits team if the delay will impact the delivery deadline.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-800">Specification Clarification</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    If design specifications are unclear or appear to contain errors, request clarification before 
                    proceeding with production. Do not make assumptions about design intent.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="flex items-start">
                <Sparkles className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-green-800">Quality Improvement</h3>
                  <p className="text-sm text-green-700 mt-1">
                    If you identify potential quality improvements or more efficient production methods, 
                    document your suggestions and share them through the feedback system. We value your expertise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button asChild variant="default">
            <Link href="/manufacturing-orders">
              <span className="flex items-center">
                Start Manufacturing <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}