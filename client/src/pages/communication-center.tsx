import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import DesignCommunicationPage from "./design-communication";
import ProductionCommunication from "./production-communication";

export default function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState("design");

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Communication Center</h1>
      </div>

      <Tabs defaultValue="design" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="design">Design Communication</TabsTrigger>
            <TabsTrigger value="production">Production Communication</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="design" className="mt-0">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Design Communication</CardTitle>
              <CardDescription>
                Manage and track all design-related communications
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-0">
              <div className="design-communication-wrapper">
                <DesignCommunicationPage isEmbedded={true} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="production" className="mt-0">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Production Communication</CardTitle>
              <CardDescription>
                Manage and track all production and manufacturing communications
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-0">
              <div className="production-communication-wrapper">
                <ProductionCommunication isEmbedded={true} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}