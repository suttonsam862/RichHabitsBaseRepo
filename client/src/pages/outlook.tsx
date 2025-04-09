import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Search,
  Mail,
  Inbox,
  Archive,
  Send,
  Trash2,
  FileText,
  ChevronDown,
  Star,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  Paperclip,
  Filter,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

// Email types
interface Email {
  id: string;
  from: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  to: {
    name: string;
    email: string;
  }[];
  cc?: {
    name: string;
    email: string;
  }[];
  bcc?: {
    name: string;
    email: string;
  }[];
  subject: string;
  body: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: {
    filename: string;
    filesize: string;
    url: string;
  }[];
  date: string;
  folder: string;
  isStarred: boolean;
  labels?: string[];
}

// Sample initial data
// In a real implementation, this would be replaced with API calls to the Microsoft Graph API
const INITIAL_EMAILS: Email[] = [
  {
    id: "1",
    from: {
      name: "John Smith",
      email: "john.smith@example.com",
    },
    to: [
      {
        name: "Me",
        email: "me@rich-habits.com",
      },
    ],
    subject: "Design Approval for Navarro High School Order",
    body: "<p>Hi there,</p><p>I've reviewed the latest design mockups for the Navarro High School wrestling team uniforms and they look fantastic. The color scheme and layout perfectly capture the team spirit while maintaining a professional appearance.</p><p>Could you please send over the final production files so we can get started on manufacturing? We'll need to have these ready by the end of the month to meet the team's schedule.</p><p>Looking forward to your response.</p><p>Best regards,<br>John Smith</p>",
    isRead: false,
    hasAttachments: true,
    attachments: [
      {
        filename: "design_feedback.pdf",
        filesize: "2.4 MB",
        url: "#",
      },
    ],
    date: "2025-04-09T10:30:00Z",
    folder: "inbox",
    isStarred: true,
  },
  {
    id: "2",
    from: {
      name: "Emily Johnson",
      email: "emily.johnson@example.com",
    },
    to: [
      {
        name: "Me",
        email: "me@rich-habits.com",
      },
    ],
    subject: "Invoice for Order #RH-2023-0456",
    body: "<p>Hello,</p><p>I'm following up on the invoice for order #RH-2023-0456. Our accounting department has noted that this payment is now 7 days past due.</p><p>Could you please process this payment at your earliest convenience? I've attached a copy of the invoice for your reference.</p><p>If you have any questions or need to discuss payment terms, please don't hesitate to contact me.</p><p>Thank you for your attention to this matter.</p><p>Best regards,<br>Emily Johnson<br>Accounting Department</p>",
    isRead: true,
    hasAttachments: true,
    attachments: [
      {
        filename: "invoice_RH-2023-0456.pdf",
        filesize: "356 KB",
        url: "#",
      },
    ],
    date: "2025-04-08T14:15:00Z",
    folder: "inbox",
    isStarred: false,
  },
  {
    id: "3",
    from: {
      name: "Michael Davis",
      email: "michael.davis@example.com",
    },
    to: [
      {
        name: "Me",
        email: "me@rich-habits.com",
      },
    ],
    subject: "Production Timeline Update",
    body: "<p>Hello team,</p><p>I wanted to provide an update on our current production timeline. We're experiencing some slight delays with material delivery from our suppliers, which may impact our delivery schedule for the following orders:</p><ul><li>Order #RH-2023-0789 - Expected delay: 3 days</li><li>Order #RH-2023-0790 - Expected delay: 2 days</li></ul><p>We're working closely with our suppliers to minimize these delays and will keep you updated on any changes.</p><p>Please let me know if you need any additional information or if this causes any critical issues with your clients.</p><p>Thanks for your understanding.</p><p>Best regards,<br>Michael Davis<br>Production Manager</p>",
    isRead: true,
    hasAttachments: false,
    date: "2025-04-07T09:45:00Z",
    folder: "inbox",
    isStarred: false,
  },
  {
    id: "4",
    from: {
      name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
    },
    to: [
      {
        name: "Me",
        email: "me@rich-habits.com",
      },
    ],
    subject: "New Product Line Inquiry",
    body: "<p>Hi,</p><p>I represent Central High School and we're interested in exploring your custom athletic wear for our various sports teams. We're particularly interested in:</p><ul><li>Football uniforms (55 players)</li><li>Basketball uniforms (30 players)</li><li>Track and field gear (45 athletes)</li></ul><p>Could you provide some information about your product offerings, customization options, and typical turnaround times? We're planning for the upcoming fall semester and would like to get the process started soon.</p><p>I look forward to hearing from you.</p><p>Best regards,<br>Sarah Wilson<br>Athletics Director<br>Central High School</p>",
    isRead: false,
    hasAttachments: false,
    date: "2025-04-06T11:20:00Z",
    folder: "inbox",
    isStarred: true,
  },
  {
    id: "5",
    from: {
      name: "Alex Rodriguez",
      email: "alex.rodriguez@example.com",
    },
    to: [
      {
        name: "Me",
        email: "me@rich-habits.com",
      },
    ],
    cc: [
      {
        name: "Sales Team",
        email: "sales@rich-habits.com",
      },
    ],
    subject: "Client Feedback: Eastside Volleyball Club",
    body: "<p>Team,</p><p>I had a follow-up call with the Eastside Volleyball Club today regarding their recent order. They were extremely satisfied with the quality of the uniforms and the quick delivery.</p><p>They mentioned they would be interested in placing another order for their upcoming season in about 3 months. They also expressed interest in our premium fabric options for their competition uniforms.</p><p>I've added a reminder to follow up with them in 2 months to discuss specifics. This could be a good opportunity for a repeat client with a larger order.</p><p>Great job everyone!</p><p>Regards,<br>Alex Rodriguez<br>Sales Representative</p>",
    isRead: true,
    hasAttachments: false,
    date: "2025-04-05T16:30:00Z",
    folder: "inbox",
    isStarred: false,
  },
];

// Form schemas
const newEmailSchema = z.object({
  to: z.string().email("Please enter a valid email address"),
  cc: z.string().email("Please enter a valid email address").optional(),
  bcc: z.string().email("Please enter a valid email address").optional(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
});

type NewEmailFormValues = z.infer<typeof newEmailSchema>;

export default function OutlookPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("inbox");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [composeOpen, setComposeOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filter emails based on folder and search query
  const filteredEmails = emails.filter((email) => {
    if (email.folder !== selectedFolder) return false;
    
    if (searchQuery.trim() === "") return true;
    
    const query = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(query) ||
      email.from.name.toLowerCase().includes(query) ||
      email.from.email.toLowerCase().includes(query) ||
      email.body.toLowerCase().includes(query)
    );
  });

  // Get unread count
  const unreadCount = emails.filter(
    (email) => email.folder === "inbox" && !email.isRead
  ).length;

  // New email form
  const form = useForm<NewEmailFormValues>({
    resolver: zodResolver(newEmailSchema),
    defaultValues: {
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: "",
    },
  });

  // Simulate email refresh
  const refreshEmails = () => {
    setIsRefreshing(true);
    // In a real implementation, this would be an API call to fetch new emails
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Inbox refreshed",
        description: "Your inbox has been updated with the latest emails.",
      });
    }, 1500);
  };

  // Handle marking email as read when opened
  useEffect(() => {
    if (selectedEmail && !selectedEmail.isRead) {
      setEmails((prevEmails) =>
        prevEmails.map((email) =>
          email.id === selectedEmail.id
            ? { ...email, isRead: true }
            : email
        )
      );
    }
  }, [selectedEmail]);

  // Handle sending a new email
  const onSendEmail = (data: NewEmailFormValues) => {
    // In a real implementation, this would be an API call to send the email
    const newEmail: Email = {
      id: `new-${Date.now()}`,
      from: {
        name: user?.fullName || "Me",
        email: user?.email || "me@rich-habits.com",
      },
      to: [
        {
          name: "",
          email: data.to,
        },
      ],
      subject: data.subject,
      body: data.body,
      isRead: true,
      hasAttachments: false,
      date: new Date().toISOString(),
      folder: "sent",
      isStarred: false,
    };

    if (data.cc) {
      newEmail.cc = [
        {
          name: "",
          email: data.cc,
        },
      ];
    }

    if (data.bcc) {
      newEmail.bcc = [
        {
          name: "",
          email: data.bcc,
        },
      ];
    }

    // Add the new email to the emails array
    setEmails((prevEmails) => [...prevEmails, newEmail]);

    // Reset form and close compose dialog
    form.reset();
    setComposeOpen(false);

    // Show success toast
    toast({
      title: "Email sent successfully",
      description: "Your email has been sent.",
    });
  };

  // Handle email actions
  const handleStarEmail = (emailId: string) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email.id === emailId
          ? { ...email, isStarred: !email.isStarred }
          : email
      )
    );
  };

  const handleArchiveEmail = (emailId: string) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email.id === emailId
          ? { ...email, folder: "archive" }
          : email
      )
    );
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
    toast({
      title: "Email archived",
      description: "The email has been moved to the archive folder.",
    });
  };

  const handleDeleteEmail = (emailId: string) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email.id === emailId
          ? { ...email, folder: "trash" }
          : email
      )
    );
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
    toast({
      title: "Email deleted",
      description: "The email has been moved to the trash folder.",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Outlook Email</h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={refreshEmails}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Email
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 bg-white rounded-lg shadow">
          {/* Email sidebar */}
          <div className="col-span-3 border-r min-h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search emails..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Button
                  variant={selectedFolder === "inbox" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder("inbox")}
                >
                  <Inbox className="h-4 w-4 mr-2" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge className="ml-auto" variant="default">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={selectedFolder === "sent" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder("sent")}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Sent
                </Button>
                <Button
                  variant={selectedFolder === "archive" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder("archive")}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant={selectedFolder === "trash" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder("trash")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Trash
                </Button>
              </div>
            </div>
          </div>

          {/* Email list */}
          <div className="col-span-9 flex">
            {filteredEmails.length > 0 ? (
              <div className="grid grid-cols-12 w-full">
                <div className={`${selectedEmail ? 'col-span-4' : 'col-span-12'} border-r overflow-auto max-h-[calc(100vh-12rem)]`}>
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`border-b p-3 cursor-pointer ${
                        !email.isRead ? "bg-blue-50" : ""
                      } ${
                        selectedEmail?.id === email.id ? "bg-gray-100" : ""
                      } hover:bg-gray-100`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>
                              {email.from.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium truncate max-w-[180px]">
                            {email.from.name}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(email.date)}
                        </div>
                      </div>
                      <div className="mt-1 flex items-start">
                        <div className="flex-1">
                          <div className={`text-sm ${!email.isRead ? "font-semibold" : ""} truncate`}>
                            {email.subject}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {email.body.replace(/<[^>]*>/g, '').substring(0, 60)}...
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {email.isStarred && (
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          )}
                          {email.hasAttachments && (
                            <Paperclip className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email detail view */}
                {selectedEmail && (
                  <div className="col-span-8 overflow-auto max-h-[calc(100vh-12rem)]">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStarEmail(selectedEmail.id)}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                selectedEmail.isStarred
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-400"
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveEmail(selectedEmail.id)}
                          >
                            <Archive className="h-5 w-5 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmail(selectedEmail.id)}
                          >
                            <Trash2 className="h-5 w-5 text-gray-400" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-5 w-5 text-gray-400" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback>
                            {selectedEmail.from.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="font-medium">{selectedEmail.from.name}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(selectedEmail.date).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {selectedEmail.from.email}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            To: {selectedEmail.to.map((recipient) => recipient.email).join(", ")}
                          </div>
                          {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                            <div className="text-sm text-gray-600">
                              CC: {selectedEmail.cc.map((recipient) => recipient.email).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="prose prose-sm max-w-none border-t pt-4">
                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                      </div>

                      {selectedEmail.hasAttachments && selectedEmail.attachments && (
                        <div className="mt-6 border-t pt-4">
                          <h3 className="text-sm font-medium mb-2">Attachments</h3>
                          <div className="space-y-2">
                            {selectedEmail.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center p-2 border rounded-md"
                              >
                                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {attachment.filename}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {attachment.filesize}
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 pt-4 border-t">
                        <Button className="w-full">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex items-center justify-center p-8">
                <div className="text-center">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                      <p className="text-gray-500 mt-1">
                        We couldn't find any emails matching "{searchQuery}"
                      </p>
                    </>
                  ) : (
                    <>
                      <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No emails</h3>
                      <p className="text-gray-500 mt-1">
                        This folder is empty
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose email dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New Email</DialogTitle>
            <DialogDescription>
              Compose and send a new email message
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSendEmail)} className="space-y-4">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Input placeholder="recipient@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CC</FormLabel>
                    <FormControl>
                      <Input placeholder="cc@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bcc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BCC</FormLabel>
                    <FormControl>
                      <Input placeholder="bcc@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Compose your message..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send Email</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}