import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Save,
  Trash2,
  Plus,
  Download,
  Upload,
  Calendar,
  Search,
  Loader2,
  Image,
  Video,
  FileText,
  MessageSquare,
  Mail,
  Instagram,
  Twitter,
  Facebook,
  Newspaper,
  Share2,
  Edit,
  Link as LinkIcon,
  FileImage,
  MoreHorizontal,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
  Building,
  DollarSign
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon } from "@radix-ui/react-icons";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";

// Types
interface SocialMedia {
  id: number;
  platform: 'facebook' | 'instagram' | 'twitter' | 'other';
  content: string;
  imageUrl?: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedAt?: string;
  author?: string;
  likes?: number;
  shares?: number;
  comments?: number;
  link?: string;
}

interface EmailCampaign {
  id: number;
  subject: string;
  content: string;
  templateId?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  recipients: number;
  opens?: number;
  clicks?: number;
  sender?: string;
  previewText?: string;
}

interface MediaAsset {
  id: number;
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  dimensions?: string;
  uploadedAt: string;
  uploadedBy?: string;
  status: 'processing' | 'active' | 'archived';
  tags?: string[];
  category?: string;
}

interface Sponsor {
  id: number;
  name: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'other';
  logoUrl?: string;
  website?: string;
  contribution: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  boothLocation?: string;
  adSpecs?: {
    type: string;
    dimensions: string;
    assetUrl?: string;
  }[];
}

function MediaPanel() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("social");
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedSponsorId, setSelectedSponsorId] = useState<number | null>(null);
  const [newSocialPost, setNewSocialPost] = useState<Partial<SocialMedia>>({
    platform: 'instagram',
    content: '',
    status: 'draft'
  });
  const [newEmailCampaign, setNewEmailCampaign] = useState<Partial<EmailCampaign>>({
    subject: '',
    content: '',
    status: 'draft',
    recipients: 0
  });
  const [newMediaAsset, setNewMediaAsset] = useState<Partial<MediaAsset>>({
    name: '',
    type: 'image',
    status: 'processing'
  });
  const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({
    name: '',
    tier: 'gold',
    contribution: 0
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Fetch camp details
  const { 
    data: camp, 
    isLoading: isLoadingCamp,
    isError: isCampError
  } = useQuery({
    queryKey: ['/api/camps', campId],
    enabled: !!campId,
  });
  
  // Fetch social media posts
  const {
    data: socialPosts,
    isLoading: isLoadingSocial
  } = useQuery({
    queryKey: ['/api/camps', campId, 'social-media'],
    enabled: !!campId,
  });
  
  // Fetch email campaigns
  const {
    data: emailCampaigns,
    isLoading: isLoadingEmails
  } = useQuery({
    queryKey: ['/api/camps', campId, 'email-campaigns'],
    enabled: !!campId,
  });
  
  // Fetch media assets
  const {
    data: mediaAssets,
    isLoading: isLoadingAssets
  } = useQuery({
    queryKey: ['/api/camps', campId, 'media-assets'],
    enabled: !!campId,
  });
  
  // Fetch sponsors
  const {
    data: sponsors,
    isLoading: isLoadingSponsors
  } = useQuery({
    queryKey: ['/api/camps', campId, 'sponsors'],
    enabled: !!campId,
  });
  
  // Create social media post mutation
  const createSocialPostMutation = useMutation({
    mutationFn: async (postData: Partial<SocialMedia>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/social-media`,
        postData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Social post created",
        description: "Your social media post has been created successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'social-media']
      });
      setShowAddSocial(false);
      setNewSocialPost({
        platform: 'instagram',
        content: '',
        status: 'draft'
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create email campaign mutation
  const createEmailCampaignMutation = useMutation({
    mutationFn: async (campaignData: Partial<EmailCampaign>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/email-campaigns`,
        campaignData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email campaign created",
        description: "Your email campaign has been created successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'email-campaigns']
      });
      setShowAddEmail(false);
      setNewEmailCampaign({
        subject: '',
        content: '',
        status: 'draft',
        recipients: 0
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Upload media asset mutation
  const uploadMediaAssetMutation = useMutation({
    mutationFn: async (assetData: FormData) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/media-assets/upload`,
        assetData,
        true
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Asset uploaded",
        description: "Your media asset has been uploaded successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'media-assets']
      });
      setShowAddAsset(false);
      setNewMediaAsset({
        name: '',
        type: 'image',
        status: 'processing'
      });
      setPreviewImage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload asset",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create sponsor mutation
  const createSponsorMutation = useMutation({
    mutationFn: async (sponsorData: Partial<Sponsor>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/sponsors`,
        sponsorData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sponsor added",
        description: "The sponsor has been added successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'sponsors']
      });
      setShowAddSponsor(false);
      setNewSponsor({
        name: '',
        tier: 'gold',
        contribution: 0
      });
      setPreviewImage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add sponsor",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete media asset mutation
  const deleteMediaAssetMutation = useMutation({
    mutationFn: async (assetId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/camps/${campId}/media-assets/${assetId}`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Asset deleted",
        description: "The media asset has been deleted successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'media-assets']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete asset",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle social post creation
  const handleCreateSocialPost = () => {
    if (!newSocialPost.content) {
      toast({
        title: "Missing content",
        description: "Please enter content for your social media post.",
        variant: "destructive"
      });
      return;
    }
    
    createSocialPostMutation.mutate(newSocialPost);
  };
  
  // Handle email campaign creation
  const handleCreateEmailCampaign = () => {
    if (!newEmailCampaign.subject || !newEmailCampaign.content) {
      toast({
        title: "Missing information",
        description: "Please enter a subject and content for your email campaign.",
        variant: "destructive"
      });
      return;
    }
    
    createEmailCampaignMutation.mutate(newEmailCampaign);
  };
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Set media asset details based on file
    setNewMediaAsset({
      ...newMediaAsset,
      name: file.name.split('.')[0],
      type: file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
          ? 'video' 
          : 'document',
      fileSize: file.size
    });
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };
  
  // Handle asset upload
  const handleUploadAsset = () => {
    const fileInput = document.getElementById('asset-file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newMediaAsset.name) {
      setNewMediaAsset({
        ...newMediaAsset,
        name: file.name.split('.')[0]
      });
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', newMediaAsset.name || file.name.split('.')[0]);
    formData.append('type', newMediaAsset.type || 'other');
    formData.append('category', newMediaAsset.category || 'general');
    if (newMediaAsset.tags) {
      formData.append('tags', JSON.stringify(newMediaAsset.tags));
    }
    
    uploadMediaAssetMutation.mutate(formData);
  };
  
  // Handle sponsor logo upload
  const handleSponsorLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle sponsor creation
  const handleCreateSponsor = () => {
    if (!newSponsor.name || !newSponsor.contribution) {
      toast({
        title: "Missing information",
        description: "Please enter name and contribution amount for the sponsor.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real implementation, we would upload the logo file
    // For now, we'll just submit the sponsor data
    createSponsorMutation.mutate(newSponsor);
  };
  
  // Handle asset deletion
  const handleDeleteAsset = (assetId: number) => {
    deleteMediaAssetMutation.mutate(assetId);
  };
  
  // Copy asset URL to clipboard
  const handleCopyAssetUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: "The asset URL has been copied to your clipboard."
    });
  };
  
  // Go back to camp project
  const handleBackToCamp = () => {
    window.location.href = `/events/camp-project?campId=${campId}`;
  };
  
  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };
  
  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Scheduled</Badge>;
      case 'published':
      case 'sent':
        return <Badge variant="outline" className="bg-green-100 text-green-800">
          {status === 'published' ? 'Published' : 'Sent'}
        </Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get asset type icon
  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  // Get sponsor tier badge
  const getSponsorTierBadge = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <Badge className="bg-slate-300 text-slate-800 hover:bg-slate-300">Platinum</Badge>;
      case 'gold':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Gold</Badge>;
      case 'silver':
        return <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">Silver</Badge>;
      case 'bronze':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Bronze</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };
  
  // Loading state
  if (isLoadingCamp) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (isCampError || !camp?.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToCamp}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Camp
          </Button>
        </div>
        
        <Card className="mx-auto max-w-md text-center p-6">
          <CardHeader>
            <CardTitle>Camp Not Found</CardTitle>
            <CardDescription>
              The camp you are looking for does not exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.href = '/events/overview'}>
              View All Camps
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const campData = camp.data;
  const socialData = socialPosts?.data || [];
  const emailData = emailCampaigns?.data || [];
  const assetsData = mediaAssets?.data || [];
  const sponsorsData = sponsors?.data || [];
  
  // Filter assets based on search and type
  const filteredAssets = assetsData.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || asset.type === statusFilter)
  );
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToCamp} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-1">Back to Camp</span>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">Marketing & Media</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {campData.name} - {formatDate(campData.startDate)} to {formatDate(campData.endDate)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowAddSocial(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Social Media Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAddEmail(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Email Campaign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAddAsset(true)}>
                <FileImage className="mr-2 h-4 w-4" />
                Upload Media Asset
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAddSponsor(true)}>
                <Building className="mr-2 h-4 w-4" />
                Add Sponsor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 md:w-[600px]">
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="assets">Media Assets</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
        </TabsList>
        
        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Social Media</h2>
              <p className="text-muted-foreground">
                Create and schedule posts for your social media channels
              </p>
            </div>
            <Button onClick={() => setShowAddSocial(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </div>
          
          {isLoadingSocial ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : socialData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Social Media Posts Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Create and schedule posts to promote your camp on social media platforms.
                </p>
                <Button onClick={() => setShowAddSocial(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {socialData.map((post: SocialMedia) => (
                <Card key={post.id} className="overflow-hidden">
                  {/* Platform color bar */}
                  <div className={`h-1 w-full ${
                    post.platform === 'instagram' ? 'bg-purple-500' :
                    post.platform === 'facebook' ? 'bg-blue-600' :
                    post.platform === 'twitter' ? 'bg-blue-400' :
                    'bg-gray-500'
                  }`} />
                  
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                          post.platform === 'instagram' ? 'bg-purple-100 text-purple-600' :
                          post.platform === 'facebook' ? 'bg-blue-100 text-blue-600' :
                          post.platform === 'twitter' ? 'bg-blue-100 text-blue-400' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getPlatformIcon(post.platform)}
                        </div>
                        <div className="ml-2">
                          <CardTitle className="text-base capitalize">{post.platform}</CardTitle>
                          <CardDescription className="text-xs">
                            {post.status === 'published' ? (
                              <>Posted {post.publishedAt ? formatDate(post.publishedAt) : 'recently'}</>
                            ) : post.status === 'scheduled' ? (
                              <>Scheduled for {post.scheduledFor ? formatDate(post.scheduledFor) : 'later'}</>
                            ) : (
                              <>Draft</>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(post.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    {post.imageUrl && (
                      <div className="relative mb-3 rounded-md overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt="Post content" 
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                    
                    <p className="text-sm">{post.content}</p>
                    
                    {(post.likes !== undefined || post.shares !== undefined || post.comments !== undefined) && (
                      <div className="flex items-center mt-3 text-xs text-muted-foreground">
                        {post.likes !== undefined && (
                          <div className="flex items-center mr-3">
                            <span className="font-medium">{post.likes}</span>
                            <span className="ml-1">likes</span>
                          </div>
                        )}
                        {post.comments !== undefined && (
                          <div className="flex items-center mr-3">
                            <span className="font-medium">{post.comments}</span>
                            <span className="ml-1">comments</span>
                          </div>
                        )}
                        {post.shares !== undefined && (
                          <div className="flex items-center">
                            <span className="font-medium">{post.shares}</span>
                            <span className="ml-1">shares</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="p-3 bg-gray-50 border-t flex justify-between">
                    {post.status === 'draft' ? (
                      <>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm">
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          Publish
                        </Button>
                      </>
                    ) : post.status === 'scheduled' ? (
                      <>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Clock className="h-4 w-4 mr-1" />
                          {post.scheduledFor ? formatDate(post.scheduledFor) : 'Scheduled'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm">
                          <LinkIcon className="h-4 w-4 mr-1" />
                          View Post
                        </Button>
                        <Button variant="outline" size="sm">
                          <ArrowDownCircle className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Email Campaigns Tab */}
        <TabsContent value="email" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Email Campaigns</h2>
              <p className="text-muted-foreground">
                Create and manage email campaigns for your camp
              </p>
            </div>
            <Button onClick={() => setShowAddEmail(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
          
          {isLoadingEmails ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : emailData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Email Campaigns Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Create and send email campaigns to communicate with participants and stakeholders.
                </p>
                <Button onClick={() => setShowAddEmail(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead className="text-right">Performance</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailData.map((campaign: EmailCampaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div className="font-medium">{campaign.subject}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {campaign.previewText || campaign.content.substring(0, 60) + '...'}
                            </div>
                            {campaign.status === 'scheduled' && campaign.scheduledFor && (
                              <div className="flex items-center mt-1 text-xs">
                                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Scheduled for {formatDate(campaign.scheduledFor)}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(campaign.status)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{campaign.recipients}</div>
                            <div className="text-xs text-muted-foreground">recipients</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {campaign.status === 'sent' && campaign.opens !== undefined ? (
                              <div>
                                <div className="font-medium">
                                  {campaign.opens} opens ({Math.round((campaign.opens / campaign.recipients) * 100)}%)
                                </div>
                                {campaign.clicks !== undefined && (
                                  <div className="text-xs text-muted-foreground">
                                    {campaign.clicks} clicks ({Math.round((campaign.clicks / campaign.recipients) * 100)}%)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Test
                                </DropdownMenuItem>
                                {campaign.status === 'draft' && (
                                  <DropdownMenuItem>
                                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                                    Send Now
                                  </DropdownMenuItem>
                                )}
                                {campaign.status === 'sent' && (
                                  <DropdownMenuItem>
                                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                                    View Analytics
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Media Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Media Assets</h2>
              <p className="text-muted-foreground">
                Manage images, videos, and other media for your camp
              </p>
            </div>
            <Button onClick={() => setShowAddAsset(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Asset
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64 space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search assets..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="bg-white border rounded-md overflow-hidden">
                <div className="p-3 font-medium border-b">Asset Type</div>
                <div className="p-2">
                  <RadioGroup value={statusFilter} onValueChange={setStatusFilter} className="space-y-1">
                    <div className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100">
                      <RadioGroupItem value="all" id="filter-all" />
                      <Label htmlFor="filter-all">All Types</Label>
                    </div>
                    <div className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100">
                      <RadioGroupItem value="image" id="filter-image" />
                      <Label htmlFor="filter-image">Images</Label>
                    </div>
                    <div className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100">
                      <RadioGroupItem value="video" id="filter-video" />
                      <Label htmlFor="filter-video">Videos</Label>
                    </div>
                    <div className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100">
                      <RadioGroupItem value="document" id="filter-document" />
                      <Label htmlFor="filter-document">Documents</Label>
                    </div>
                    <div className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100">
                      <RadioGroupItem value="other" id="filter-other" />
                      <Label htmlFor="filter-other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Storage Usage</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Images</span>
                        <span className="text-muted-foreground">
                          {formatFileSize(assetsData
                            .filter(asset => asset.type === 'image')
                            .reduce((total, asset) => total + (asset.fileSize || 0), 0)
                          )}
                        </span>
                      </div>
                      <Progress 
                        value={assetsData
                          .filter(asset => asset.type === 'image')
                          .reduce((total, asset) => total + (asset.fileSize || 0), 0) /
                          assetsData.reduce((total, asset) => total + (asset.fileSize || 0), 1) * 100} 
                        className="h-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Videos</span>
                        <span className="text-muted-foreground">
                          {formatFileSize(assetsData
                            .filter(asset => asset.type === 'video')
                            .reduce((total, asset) => total + (asset.fileSize || 0), 0)
                          )}
                        </span>
                      </div>
                      <Progress 
                        value={assetsData
                          .filter(asset => asset.type === 'video')
                          .reduce((total, asset) => total + (asset.fileSize || 0), 0) /
                          assetsData.reduce((total, asset) => total + (asset.fileSize || 0), 1) * 100} 
                        className="h-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Documents</span>
                        <span className="text-muted-foreground">
                          {formatFileSize(assetsData
                            .filter(asset => asset.type === 'document')
                            .reduce((total, asset) => total + (asset.fileSize || 0), 0)
                          )}
                        </span>
                      </div>
                      <Progress 
                        value={assetsData
                          .filter(asset => asset.type === 'document')
                          .reduce((total, asset) => total + (asset.fileSize || 0), 0) /
                          assetsData.reduce((total, asset) => total + (asset.fileSize || 0), 1) * 100} 
                        className="h-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex-grow">
              {isLoadingAssets ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredAssets.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Media Assets Yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      {searchTerm || statusFilter !== 'all' ? 
                        'No assets match your search criteria.' : 
                        'Upload images, videos, and documents to use in your marketing materials.'}
                    </p>
                    <Button onClick={() => setShowAddAsset(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Asset
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssets.map((asset: MediaAsset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      {/* Preview area */}
                      <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
                        {asset.type === 'image' && asset.url ? (
                          <img 
                            src={asset.url} 
                            alt={asset.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : asset.type === 'video' && asset.thumbnailUrl ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={asset.thumbnailUrl} 
                              alt={asset.name} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="rounded-full bg-black/60 p-2">
                                <Video className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            {getAssetTypeIcon(asset.type)}
                            <p className="mt-2 text-xs text-muted-foreground">{asset.type}</p>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium truncate mr-2">{asset.name}</div>
                          <Badge variant="outline" className="flex-shrink-0 capitalize">
                            {asset.type}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{formatDate(asset.uploadedAt)}</span>
                          <span>{formatFileSize(asset.fileSize)}</span>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-2 pt-0 flex justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyAssetUrl(asset.url)}
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Sponsors Tab */}
        <TabsContent value="sponsors" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Sponsors</h2>
              <p className="text-muted-foreground">
                Manage sponsors and promotional partners for your camp
              </p>
            </div>
            <Button onClick={() => setShowAddSponsor(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sponsor
            </Button>
          </div>
          
          {isLoadingSponsors ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sponsorsData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Sponsors Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Add sponsors and partners to showcase their support for your camp.
                </p>
                <Button onClick={() => setShowAddSponsor(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Sponsor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Sponsor tiers groups */}
              {['platinum', 'gold', 'silver', 'bronze', 'other'].map(tier => {
                const tierSponsors = sponsorsData.filter((s: Sponsor) => s.tier === tier);
                if (tierSponsors.length === 0) return null;
                
                return (
                  <div key={tier} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium capitalize">{tier} Sponsors</h3>
                      <Badge variant="outline" className="capitalize">{tierSponsors.length}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tierSponsors.map((sponsor: Sponsor) => (
                        <Card key={sponsor.id} className="overflow-hidden">
                          <div className="p-4 flex items-center justify-center bg-gray-50 border-b h-40">
                            {sponsor.logoUrl ? (
                              <img 
                                src={sponsor.logoUrl} 
                                alt={sponsor.name} 
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <Building className="h-12 w-12 mb-2" />
                                <p>No logo available</p>
                              </div>
                            )}
                          </div>
                          
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="space-y-1">
                                <h4 className="font-medium">{sponsor.name}</h4>
                                {sponsor.website && (
                                  <a 
                                    href={sponsor.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-blue-600 hover:underline"
                                  >
                                    <LinkIcon className="h-3 w-3 mr-1" />
                                    {sponsor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                  </a>
                                )}
                              </div>
                              {getSponsorTierBadge(sponsor.tier)}
                            </div>
                            
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Contribution:</span>
                                <span className="font-medium">{formatCurrency(sponsor.contribution)}</span>
                              </div>
                              
                              {sponsor.contactName && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Contact:</span>
                                  <span>{sponsor.contactName}</span>
                                </div>
                              )}
                              
                              {sponsor.boothLocation && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Booth:</span>
                                  <span>{sponsor.boothLocation}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          
                          <CardFooter className="px-4 py-3 bg-gray-50 border-t">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => setSelectedSponsorId(sponsor.id)}
                            >
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Social Media Post Dialog */}
      <Dialog open={showAddSocial} onOpenChange={setShowAddSocial}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Social Media Post</DialogTitle>
            <DialogDescription>
              Create a new post for your social media channels
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="platform" className="text-right">
                Platform
              </Label>
              <Select 
                value={newSocialPost.platform}
                onValueChange={(value: any) => setNewSocialPost({...newSocialPost, platform: value})}
              >
                <SelectTrigger id="platform" className="col-span-3">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-right pt-2">
                Content
              </Label>
              <Textarea
                id="content"
                value={newSocialPost.content}
                onChange={(e) => setNewSocialPost({...newSocialPost, content: e.target.value})}
                className="col-span-3 min-h-[120px]"
                placeholder="Write your post content here..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">
                Image URL
              </Label>
              <Input
                id="imageUrl"
                value={newSocialPost.imageUrl || ''}
                onChange={(e) => setNewSocialPost({...newSocialPost, imageUrl: e.target.value})}
                className="col-span-3"
                placeholder="https://example.com/image.jpg (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduledFor" className="text-right">
                Schedule
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select 
                  value={newSocialPost.status}
                  onValueChange={(value: any) => setNewSocialPost({...newSocialPost, status: value})}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                    <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    <SelectItem value="published">Publish Immediately</SelectItem>
                  </SelectContent>
                </Select>
                
                {newSocialPost.status === 'scheduled' && (
                  <Input
                    type="datetime-local"
                    value={newSocialPost.scheduledFor || ''}
                    onChange={(e) => setNewSocialPost({...newSocialPost, scheduledFor: e.target.value})}
                  />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSocial(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSocialPost}>Create Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Email Campaign Dialog */}
      <Dialog open={showAddEmail} onOpenChange={setShowAddEmail}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>
              Create a new email campaign to send to your recipients
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject Line
              </Label>
              <Input
                id="subject"
                value={newEmailCampaign.subject}
                onChange={(e) => setNewEmailCampaign({...newEmailCampaign, subject: e.target.value})}
                className="col-span-3"
                placeholder="Enter email subject..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="previewText" className="text-right">
                Preview Text
              </Label>
              <Input
                id="previewText"
                value={newEmailCampaign.previewText || ''}
                onChange={(e) => setNewEmailCampaign({...newEmailCampaign, previewText: e.target.value})}
                className="col-span-3"
                placeholder="Brief text that appears after the subject line (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="emailContent" className="text-right pt-2">
                Content
              </Label>
              <Textarea
                id="emailContent"
                value={newEmailCampaign.content}
                onChange={(e) => setNewEmailCampaign({...newEmailCampaign, content: e.target.value})}
                className="col-span-3 min-h-[200px]"
                placeholder="Write your email content here..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipients" className="text-right">
                Recipients
              </Label>
              <div className="col-span-3">
                <Select 
                  value={newEmailCampaign.recipients ? 'custom' : 'all'}
                  onValueChange={(value: string) => {
                    if (value === 'all') {
                      setNewEmailCampaign({...newEmailCampaign, recipients: 0});
                    } else {
                      setNewEmailCampaign({...newEmailCampaign, recipients: 1});
                    }
                  }}
                >
                  <SelectTrigger id="recipients">
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registrants</SelectItem>
                    <SelectItem value="custom">Custom Segment</SelectItem>
                  </SelectContent>
                </Select>
                {newEmailCampaign.recipients > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Targeting {newEmailCampaign.recipients} recipients
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule" className="text-right">
                Schedule
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select 
                  value={newEmailCampaign.status}
                  onValueChange={(value: any) => setNewEmailCampaign({...newEmailCampaign, status: value})}
                >
                  <SelectTrigger id="emailStatus">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                    <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    <SelectItem value="sent">Send Immediately</SelectItem>
                  </SelectContent>
                </Select>
                
                {newEmailCampaign.status === 'scheduled' && (
                  <Input
                    type="datetime-local"
                    value={newEmailCampaign.scheduledFor || ''}
                    onChange={(e) => setNewEmailCampaign({...newEmailCampaign, scheduledFor: e.target.value})}
                  />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmail(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEmailCampaign}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Media Asset Dialog */}
      <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Media Asset</DialogTitle>
            <DialogDescription>
              Upload images, videos, or documents to use in your marketing materials
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="asset-file">Upload File</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 text-center">
                <Input
                  id="asset-file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {previewImage ? (
                  <div className="space-y-2">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="max-h-48 max-w-full object-contain mx-auto"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const fileInput = document.getElementById('asset-file') as HTMLInputElement;
                        fileInput.value = '';
                        setPreviewImage(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="h-10 w-10 mb-2" />
                      <p className="mb-1">Drag and drop or click to upload</p>
                      <p className="text-xs">Support for images, videos, and documents</p>
                    </div>
                    <Button variant="outline" onClick={() => {
                      const fileInput = document.getElementById('asset-file');
                      if (fileInput) fileInput.click();
                    }}>
                      Select File
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset-name" className="text-right">
                Name
              </Label>
              <Input
                id="asset-name"
                value={newMediaAsset.name}
                onChange={(e) => setNewMediaAsset({...newMediaAsset, name: e.target.value})}
                className="col-span-3"
                placeholder="Asset name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset-type" className="text-right">
                Type
              </Label>
              <Select 
                value={newMediaAsset.type}
                onValueChange={(value: any) => setNewMediaAsset({...newMediaAsset, type: value})}
              >
                <SelectTrigger id="asset-type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset-category" className="text-right">
                Category
              </Label>
              <Input
                id="asset-category"
                value={newMediaAsset.category || ''}
                onChange={(e) => setNewMediaAsset({...newMediaAsset, category: e.target.value})}
                className="col-span-3"
                placeholder="Optional category (e.g., 'Promotional')"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAsset(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadAsset}>Upload Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Sponsor Dialog */}
      <Dialog open={showAddSponsor} onOpenChange={setShowAddSponsor}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Sponsor</DialogTitle>
            <DialogDescription>
              Add a new sponsor or partner for your camp
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sponsor-name" className="text-right">
                Name
              </Label>
              <Input
                id="sponsor-name"
                value={newSponsor.name}
                onChange={(e) => setNewSponsor({...newSponsor, name: e.target.value})}
                className="col-span-3"
                placeholder="Sponsor name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sponsor-tier" className="text-right">
                Tier
              </Label>
              <Select 
                value={newSponsor.tier}
                onValueChange={(value: any) => setNewSponsor({...newSponsor, tier: value})}
              >
                <SelectTrigger id="sponsor-tier" className="col-span-3">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sponsor-contribution" className="text-right">
                Contribution
              </Label>
              <div className="relative col-span-3">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="sponsor-contribution"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSponsor.contribution || ''}
                  onChange={(e) => setNewSponsor({...newSponsor, contribution: parseFloat(e.target.value) || 0})}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sponsor-website" className="text-right">
                Website
              </Label>
              <Input
                id="sponsor-website"
                value={newSponsor.website || ''}
                onChange={(e) => setNewSponsor({...newSponsor, website: e.target.value})}
                className="col-span-3"
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sponsor-contact" className="text-right">
                Contact Name
              </Label>
              <Input
                id="sponsor-contact"
                value={newSponsor.contactName || ''}
                onChange={(e) => setNewSponsor({...newSponsor, contactName: e.target.value})}
                className="col-span-3"
                placeholder="Contact person name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sponsor-email" className="text-right">
                Contact Email
              </Label>
              <Input
                id="sponsor-email"
                value={newSponsor.contactEmail || ''}
                onChange={(e) => setNewSponsor({...newSponsor, contactEmail: e.target.value})}
                className="col-span-3"
                placeholder="contact@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sponsor-phone" className="text-right">
                Contact Phone
              </Label>
              <Input
                id="sponsor-phone"
                value={newSponsor.contactPhone || ''}
                onChange={(e) => setNewSponsor({...newSponsor, contactPhone: e.target.value})}
                className="col-span-3"
                placeholder="(123) 456-7890"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sponsor-booth" className="text-right">
                Booth Location
              </Label>
              <Input
                id="sponsor-booth"
                value={newSponsor.boothLocation || ''}
                onChange={(e) => setNewSponsor({...newSponsor, boothLocation: e.target.value})}
                className="col-span-3"
                placeholder="e.g., 'Main Hall, Booth #12'"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="sponsor-notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="sponsor-notes"
                value={newSponsor.notes || ''}
                onChange={(e) => setNewSponsor({...newSponsor, notes: e.target.value})}
                className="col-span-3"
                placeholder="Any additional notes about this sponsor"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="sponsor-logo" className="text-right pt-2">
                Logo
              </Label>
              <div className="col-span-3">
                <Input
                  id="sponsor-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleSponsorLogoChange}
                />
                {previewImage && (
                  <div className="mt-2">
                    <img 
                      src={previewImage} 
                      alt="Logo preview" 
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSponsor(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSponsor}>Add Sponsor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MediaPanel;