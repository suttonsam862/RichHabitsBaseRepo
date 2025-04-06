import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileImage, Pencil, Check, X, User, Calendar, Tag, MessageSquare, Palette, Upload, Download } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

interface DesignProject {
  id: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: 'new' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'completed';
  designerId: number | null;
  designerName: string | null;
  description: string;
  requirements: string;
  attachments: string[];
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  feedback?: string;
  approvedVersion?: number;
}

interface DesignVersion {
  id: number;
  projectId: number;
  versionNumber: number;
  designUrl: string;
  thumbnailUrl: string;
  description: string;
  createdAt: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  feedback?: string;
}

export default function DesignPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProject, setSelectedProject] = useState<DesignProject | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({
    designFile: null as File | null,
    description: "",
  });
  const [feedback, setFeedback] = useState("");

  const { toast } = useToast();

  const { data: designProjects, isLoading } = useQuery({
    queryKey: ['/api/design/projects'],
    refetchInterval: false,
  });

  const { data: projectVersions, isLoading: versionsLoading } = useQuery({
    queryKey: ['/api/design/versions', selectedProject?.id],
    enabled: !!selectedProject,
  });

  const claimProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await fetch(`/api/design/projects/${projectId}/claim`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to claim project');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/design/projects']});
      toast({
        title: "Project claimed",
        description: "You have successfully claimed this design project",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async (data: {projectId: number, designFile: File, description: string}) => {
      const formData = new FormData();
      formData.append('designFile', data.designFile);
      formData.append('description', data.description);
      
      const res = await fetch(`/api/design/projects/${data.projectId}/versions`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Failed to upload design version');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/design/versions', selectedProject?.id]});
      setUploadDialogOpen(false);
      setNewVersion({
        designFile: null,
        description: "",
      });
      toast({
        title: "Version uploaded",
        description: "Your design version has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: {versionId: number, feedback: string, status: 'approved' | 'rejected'}) => {
      const res = await fetch(`/api/design/versions/${data.versionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: data.feedback,
          status: data.status,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to submit feedback');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/design/versions', selectedProject?.id]});
      queryClient.invalidateQueries({queryKey: ['/api/design/projects']});
      setFeedback("");
      toast({
        title: "Feedback submitted",
        description: "Your feedback has been submitted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Sample data for demonstration - would be replaced with API data
  const sampleProjects: DesignProject[] = [
    {
      id: 1,
      orderId: "ORD-0001",
      customerName: "John Smith",
      customerEmail: "john.smith@example.com",
      status: "new",
      designerId: null,
      designerName: null,
      description: "Logo design for premium service",
      requirements: "Modern, sleek design with blue and green colors. Should convey trust and reliability.",
      attachments: ["branding_guidelines.pdf"],
      thumbnailUrl: null,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      orderId: "ORD-0002",
      customerName: "Emily Johnson",
      customerEmail: "emily.johnson@example.com",
      status: "in_progress",
      designerId: 1,
      designerName: "Alice Cooper",
      description: "Website banner design",
      requirements: "Promotional banner for summer sale. Bright colors, featuring product images.",
      attachments: ["product_photos.zip", "brand_guidelines.pdf"],
      thumbnailUrl: "https://via.placeholder.com/150",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      orderId: "ORD-0003",
      customerName: "Michael Brown",
      customerEmail: "michael.brown@example.com",
      status: "review",
      designerId: 1,
      designerName: "Alice Cooper",
      description: "Product packaging design",
      requirements: "Eco-friendly packaging design for premium product line. Should highlight sustainable materials.",
      attachments: ["product_dimensions.pdf", "competitor_examples.zip"],
      thumbnailUrl: "https://via.placeholder.com/150",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      orderId: "ORD-0004",
      customerName: "Sarah Williams",
      customerEmail: "sarah.williams@example.com",
      status: "approved",
      designerId: 2,
      designerName: "Bob Richards",
      description: "Business card design",
      requirements: "Professional business card design for executive team. Minimalist approach with company branding.",
      attachments: ["logo_files.zip", "employee_info.xlsx"],
      thumbnailUrl: "https://via.placeholder.com/150",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      approvedVersion: 2,
    },
  ];

  const sampleVersions: DesignVersion[] = [
    {
      id: 1,
      projectId: 3,
      versionNumber: 1,
      designUrl: "https://via.placeholder.com/600x400",
      thumbnailUrl: "https://via.placeholder.com/150",
      description: "Initial concept based on requirements",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'submitted',
    },
    {
      id: 2,
      projectId: 3,
      versionNumber: 2,
      designUrl: "https://via.placeholder.com/600x400",
      thumbnailUrl: "https://via.placeholder.com/150",
      description: "Revised version with more eco-friendly elements",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'submitted',
    },
  ];

  const projects = designProjects?.data || sampleProjects;
  const versions = projectVersions?.data || 
                   (selectedProject ? sampleVersions.filter(v => v.projectId === selectedProject.id) : []);

  const filteredProjects = activeTab === "all" 
    ? projects 
    : projects.filter(project => {
        switch(activeTab) {
          case "new": return project.status === "new";
          case "in_progress": return project.status === "in_progress";
          case "review": return project.status === "review";
          case "completed": return ["approved", "completed"].includes(project.status);
          default: return true;
        }
      });

  const handleProjectClick = (project: DesignProject) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleClaimProject = () => {
    if (selectedProject) {
      claimProjectMutation.mutate(selectedProject.id);
    }
  };

  const handleUploadVersion = () => {
    if (selectedProject && newVersion.designFile) {
      uploadVersionMutation.mutate({
        projectId: selectedProject.id,
        designFile: newVersion.designFile,
        description: newVersion.description,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewVersion({
        ...newVersion,
        designFile: e.target.files[0],
      });
    }
  };

  const handleApproveVersion = (versionId: number) => {
    submitFeedbackMutation.mutate({
      versionId,
      feedback,
      status: 'approved',
    });
  };

  const handleRejectVersion = (versionId: number) => {
    submitFeedbackMutation.mutate({
      versionId,
      feedback,
      status: 'rejected',
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case 'review':
        return <Badge className="bg-purple-500">In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-green-700">Completed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Design Projects</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage design projects and submissions</p>
      </div>

      <div className="p-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="review">In Review</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center p-8 border rounded-lg border-dashed">
                <Palette className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">No design projects found</h3>
                <p className="text-gray-500 mt-1">Projects matching the selected filter will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <Card 
                    key={project.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleProjectClick(project)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{project.description}</CardTitle>
                        {getStatusBadge(project.status)}
                      </div>
                      <CardDescription>Order #{project.orderId}</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center mb-2">
                        <User className="mr-2 h-4 w-4 text-gray-500" />
                        <span className="text-sm">{project.customerName}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                        <span className="text-sm">{formatDate(project.createdAt)}</span>
                      </div>
                      {project.thumbnailUrl ? (
                        <div className="mt-3 w-full h-36 rounded-md overflow-hidden bg-gray-100">
                          <img 
                            src={project.thumbnailUrl} 
                            alt="Design preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mt-3 w-full h-36 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          <FileImage className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-0">
                      <div className="flex items-center text-sm text-gray-500">
                        {project.designerName ? (
                          <>
                            <Pencil className="mr-1 h-3 w-3" />
                            <span>Designer: {project.designerName}</span>
                          </>
                        ) : (
                          <>
                            <Tag className="mr-1 h-3 w-3" />
                            <span>Awaiting designer assignment</span>
                          </>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Project Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedProject?.description}</DialogTitle>
            <DialogDescription>
              Order #{selectedProject?.orderId} - {getStatusBadge(selectedProject?.status || "")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Project Details Column */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Client Information</h3>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-gray-500">Name: </span>
                    {selectedProject?.customerName}
                  </div>
                  <div>
                    <span className="text-gray-500">Email: </span>
                    {selectedProject?.customerEmail}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Requirements</h3>
                <p className="text-sm">{selectedProject?.requirements}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Attachments</h3>
                {selectedProject?.attachments && selectedProject.attachments.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {selectedProject.attachments.map((attachment, i) => (
                      <li key={i} className="flex items-center">
                        <Download className="h-4 w-4 mr-1 text-gray-500" />
                        <a
                          href="#"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle download
                          }}
                        >
                          {attachment}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No attachments available</p>
                )}
              </div>

              {selectedProject?.status === "new" && (
                <Button 
                  onClick={handleClaimProject} 
                  className="w-full"
                  disabled={claimProjectMutation.isPending}
                >
                  {claimProjectMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Claim Project
                </Button>
              )}

              {(selectedProject?.status === "in_progress" || selectedProject?.status === "review") && selectedProject.designerId === 1 && (
                <Button 
                  onClick={() => setUploadDialogOpen(true)}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Version
                </Button>
              )}
            </div>

            {/* Design Versions Column */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-medium">Design Versions</h3>
              
              {versionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center p-8 border rounded-lg border-dashed">
                  <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-medium">No versions uploaded yet</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedProject?.status === "new" 
                      ? "Claim this project to start working on it" 
                      : "Upload a design version to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <Card key={version.id} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="bg-gray-100 h-48">
                          <img 
                            src={version.thumbnailUrl} 
                            alt={`Version ${version.versionNumber}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="md:col-span-2 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Version {version.versionNumber}</h4>
                            {getStatusBadge(version.status)}
                          </div>
                          
                          <p className="text-sm">{version.description}</p>
                          
                          <div className="text-xs text-gray-500">
                            Uploaded on {formatDate(version.createdAt)}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Download className="mr-1 h-3 w-3" />
                              Download
                            </Button>
                            
                            {version.status === 'submitted' && selectedProject?.status === 'review' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleApproveVersion(version.id)}
                                >
                                  <Check className="mr-1 h-3 w-3" />
                                  Approve
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleRejectVersion(version.id)}
                                >
                                  <X className="mr-1 h-3 w-3" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                          
                          {version.feedback && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                              <span className="font-medium">Feedback: </span>
                              {version.feedback}
                            </div>
                          )}
                          
                          {version.status === 'submitted' && selectedProject?.status === 'review' && (
                            <div className="pt-2">
                              <Label htmlFor="feedback" className="text-xs">Feedback</Label>
                              <Textarea 
                                id="feedback"
                                placeholder="Enter feedback on this design version..."
                                className="mt-1 text-sm"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Version Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Design Version</DialogTitle>
            <DialogDescription>
              Upload a new version of your design for review
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="design-file">Design File</Label>
              <Input
                id="design-file"
                type="file"
                accept="image/*, application/pdf"
                onChange={handleFileChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the changes in this version..."
                value={newVersion.description}
                onChange={(e) => setNewVersion({...newVersion, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUploadVersion}
              disabled={!newVersion.designFile || !newVersion.description || uploadVersionMutation.isPending}
            >
              {uploadVersionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}