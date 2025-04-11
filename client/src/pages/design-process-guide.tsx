import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  PenTool,
  Hammer,
  Clock,
  CheckCircle,
  FileUp,
  Rotate,
  Award,
  Palette,
  Mail,
  ArrowRight,
  ImageIcon,
  MessageSquare,
  Scroll,
  ClipboardList,
  Hourglass,
  DollarSign,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Process step component
interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const ProcessStep = ({ number, title, description, icon, color }: ProcessStepProps) => (
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
    </div>
  </div>
);

export default function DesignProcessGuide() {
  const { user } = useAuth();
  const isDesigner = user?.role === "designer";
  
  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Design Process Guide</h1>
        <p className="text-xl text-gray-600">
          A comprehensive walkthrough of the design workflow
        </p>
      </div>
      
      {/* Introduction card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Welcome to the Design Platform</CardTitle>
          <CardDescription>
            This guide will walk you through the complete process of designing for Rich Habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-gray-600">
            <p>
              As a designer on our platform, you're an essential part of bringing our customers' ideas to life. 
              This guide explains the design workflow from claiming a job to getting paid.
            </p>
            <div className="bg-primary/10 p-4 rounded-md">
              <p className="font-medium text-primary">Key things to remember:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>All designs must be completed within <strong>72 hours</strong> of claiming</li>
                <li>Always follow customer specifications carefully</li>
                <li>Quality designs lead to higher ratings and more job opportunities</li>
                <li>Communication is key - check notifications regularly for updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Design Process Steps */}
      <Card>
        <CardHeader>
          <CardTitle>The Design Process</CardTitle>
          <CardDescription>
            Follow these steps for each design job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-10 mt-4">
            <ProcessStep
              number={1}
              title="Claim a Design Job"
              description="Browse available jobs in the Unclaimed Designs section. Review job details, deadlines, and payout before claiming."
              icon={<Hammer className="h-5 w-5 text-blue-500" />}
              color="bg-blue-500"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={2}
              title="Review Customer Input"
              description="Carefully read all customer requirements, reference images, and specifications to understand the project needs."
              icon={<ClipboardList className="h-5 w-5 text-indigo-500" />}
              color="bg-indigo-500"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={3}
              title="Create the Design"
              description="Use professional design tools to create high-quality designs that meet all specifications."
              icon={<PenTool className="h-5 w-5 text-violet-500" />}
              color="bg-violet-500"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={4}
              title="Submit Your Work"
              description="Upload all required design files, mockups, and detailed notes explaining your design choices."
              icon={<FileUp className="h-5 w-5 text-purple-500" />}
              color="bg-purple-500"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={5}
              title="Review & Revision"
              description="Address any feedback or revision requests promptly. You have 24 hours to complete revision requests."
              icon={<Rotate className="h-5 w-5 text-pink-500" />}
              color="bg-pink-500"
            />
            
            <div className="border-l-2 border-dashed border-gray-300 h-8 ml-6"></div>
            
            <ProcessStep
              number={6}
              title="Get Paid"
              description="Once your design is approved, you'll receive payment on the next payment cycle (1st and 15th of each month)."
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              color="bg-green-500"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Key Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Design Requirements</CardTitle>
          <CardDescription>
            Essential criteria for all design submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <ImageIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">File Requirements</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600">
                    <li>• Vector files (AI, EPS, SVG)</li>
                    <li>• High-resolution raster files (300 DPI PNG)</li>
                    <li>• Layered original files</li>
                    <li>• Mockup visualizations when applicable</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Palette className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium">Design Guidelines</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600">
                    <li>• Follow color specifications exactly</li>
                    <li>• Use appropriate typography</li>
                    <li>• Maintain scalability and proportions</li>
                    <li>• Ensure print readiness</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Timeline Expectations</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600">
                    <li>• 72-hour turnaround for initial designs</li>
                    <li>• 24-hour turnaround for revisions</li>
                    <li>• Urgent jobs may have shorter deadlines</li>
                    <li>• Always communicate potential delays</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Communication</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600">
                    <li>• Provide detailed notes with submissions</li>
                    <li>• Ask clarifying questions early</li>
                    <li>• Respond to notifications promptly</li>
                    <li>• Maintain professional communication</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Designer Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Success</CardTitle>
          <CardDescription>
            Best practices to boost your performance and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Hourglass className="h-5 w-5 text-amber-500 mr-2" />
                <h3 className="font-medium">Time Management</h3>
              </div>
              <p className="text-sm text-gray-600">
                Create a work schedule that allows you to complete jobs well before deadlines. 
                Don't overcommit by claiming too many jobs at once.
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Award className="h-5 w-5 text-emerald-500 mr-2" />
                <h3 className="font-medium">Quality First</h3>
              </div>
              <p className="text-sm text-gray-600">
                Focus on quality over quantity. High-quality designs lead to fewer revision requests,
                better ratings, and access to premium jobs.
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Mail className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="font-medium">Stay Informed</h3>
              </div>
              <p className="text-sm text-gray-600">
                Check your notifications daily, respond promptly to messages, and 
                stay updated on platform announcements and policy changes.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button asChild variant="default">
            <Link href="/unclaimed-designs">
              <span className="flex items-center">
                Start Designing <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}