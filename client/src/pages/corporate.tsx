import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Building2, Users, Phone, Mail, MapPin, Globe, FileText, Calendar, Edit } from "lucide-react";

export default function CorporatePage() {
  const [activeTab, setActiveTab] = useState("company-info");
  const [editing, setEditing] = useState(false);

  // Placeholder company data - in a real app this would come from the API
  const companyData = {
    name: "Rich Habits Athletic Apparel",
    tagline: "Performance sportswear tailored to your team's unique identity",
    description: "Rich Habits specializes in creating custom-designed, high-performance athletic apparel for teams, schools, and organizations. We offer a comprehensive solution from design consultation to manufacturing and fulfillment.",
    logo: "/company-logo.png",
    founding_date: "2015-03-12",
    tax_id: "47-2938561",
    legal_structure: "Limited Liability Company (LLC)",
    headquarters: {
      address: "2200 Athletic Drive, Suite 305",
      city: "Austin",
      state: "TX",
      zip: "78744",
      country: "USA"
    },
    contact: {
      phone: "(512) 555-8700",
      email: "info@rich-habits.com",
      website: "https://www.rich-habits.com"
    },
    social_media: {
      facebook: "richhabbits",
      instagram: "rich_habits_athletic",
      twitter: "RichHabitsApp",
      linkedin: "rich-habits-athletic"
    },
    departments: [
      {
        name: "Sales & Marketing",
        director: "Emily Rodriguez",
        email: "emily.rodriguez@rich-habits.com",
        phone: "(512) 555-8701"
      },
      {
        name: "Design & Product Development",
        director: "Marcus Chen",
        email: "marcus.chen@rich-habits.com",
        phone: "(512) 555-8702"
      },
      {
        name: "Manufacturing Operations",
        director: "Priya Patel",
        email: "priya.patel@rich-habits.com",
        phone: "(512) 555-8703"
      },
      {
        name: "Accounting & Finance",
        director: "Samuel Sutton",
        email: "samuel.sutton@rich-habits.com",
        phone: "(512) 555-8704"
      },
      {
        name: "Customer Support",
        director: "Lisa Washington",
        email: "lisa.washington@rich-habits.com",
        phone: "(512) 555-8705"
      }
    ],
    documents: [
      {
        name: "Company Articles of Organization",
        type: "legal",
        date_filed: "2015-03-12",
        file_path: "/documents/articles_of_organization.pdf"
      },
      {
        name: "Certificate of Good Standing",
        type: "legal",
        date_filed: "2024-01-10",
        file_path: "/documents/good_standing_2024.pdf"
      },
      {
        name: "Business Insurance Policy",
        type: "insurance",
        date_filed: "2024-02-15",
        file_path: "/documents/business_insurance_2024.pdf"
      },
      {
        name: "Employee Handbook",
        type: "policy",
        date_filed: "2023-11-05",
        file_path: "/documents/employee_handbook_2023.pdf"
      },
      {
        name: "Brand Guidelines",
        type: "marketing",
        date_filed: "2023-08-22",
        file_path: "/documents/brand_guidelines_2023.pdf"
      }
    ]
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Corporate Information</h1>
          <p className="text-muted-foreground">Manage company details, department structure, and corporate documents</p>
        </div>
        <Button onClick={() => setEditing(!editing)}>
          <Edit className="mr-2 h-4 w-4" />
          {editing ? "Save Changes" : "Edit Information"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="company-info">Company Info</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company-info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Legal and operational information about your company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input id="company-name" defaultValue={companyData.name} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="founding-date">Founding Date</Label>
                        <Input id="founding-date" type="date" defaultValue={companyData.founding_date} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input id="tagline" defaultValue={companyData.tagline} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Company Description</Label>
                      <Textarea id="description" rows={4} defaultValue={companyData.description} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tax-id">Tax ID / EIN</Label>
                        <Input id="tax-id" defaultValue={companyData.tax_id} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="legal-structure">Legal Structure</Label>
                        <Input id="legal-structure" defaultValue={companyData.legal_structure} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-lg">{companyData.name}</p>
                        <p className="text-muted-foreground">{companyData.tagline}</p>
                      </div>
                    </div>
                    <p>{companyData.description}</p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Founded</p>
                        <p>{new Date(companyData.founding_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax ID / EIN</p>
                        <p>{companyData.tax_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Legal Structure</p>
                        <p>{companyData.legal_structure}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How clients and partners can reach your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={companyData.contact.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" defaultValue={companyData.contact.phone} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" defaultValue={companyData.contact.website} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                      <p>{companyData.contact.email}</p>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                      <p>{companyData.contact.phone}</p>
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-3 text-muted-foreground" />
                      <p>{companyData.contact.website}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Headquarters</CardTitle>
              <CardDescription>Main office location and mailing address</CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" defaultValue={companyData.headquarters.address} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue={companyData.headquarters.city} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" defaultValue={companyData.headquarters.state} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP/Postal Code</Label>
                    <Input id="zip" defaultValue={companyData.headquarters.zip} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" defaultValue={companyData.headquarters.country} />
                  </div>
                </div>
              ) : (
                <div className="flex">
                  <MapPin className="h-5 w-5 mr-3 mt-1 text-muted-foreground shrink-0" />
                  <div>
                    <p>{companyData.headquarters.address}</p>
                    <p>{companyData.headquarters.city}, {companyData.headquarters.state} {companyData.headquarters.zip}</p>
                    <p>{companyData.headquarters.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Structure</CardTitle>
              <CardDescription>Organization of company departments and leadership</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {companyData.departments.map((dept, index) => (
                  <div key={index}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium text-lg">{dept.name}</h3>
                          <p className="text-muted-foreground">Director: {dept.director}</p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 md:items-end">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground md:order-last md:ml-2 md:mr-0" />
                          <span className="text-sm">{dept.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground md:order-last md:ml-2 md:mr-0" />
                          <span className="text-sm">{dept.phone}</span>
                        </div>
                      </div>
                    </div>
                    {index < companyData.departments.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                View Organizational Chart
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Documents</CardTitle>
              <CardDescription>Legal, financial, and operational documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {companyData.documents.map((doc, index) => (
                  <div key={index}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{new Date(doc.date_filed).toLocaleDateString()}</span>
                        <Button variant="ghost" size="sm" className="ml-2">
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </div>
                    </div>
                    {index < companyData.documents.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Upload New Document
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}