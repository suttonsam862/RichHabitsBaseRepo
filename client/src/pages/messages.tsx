import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message } from "@/types";
import { getRelativeTime } from "@/lib/utils";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/messages/conversations'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages/conversation', selectedConversation],
    enabled: !!selectedConversation,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample data - would normally come from the API
  const sampleConversations = [
    {
      id: 1,
      name: "John Smith",
      avatar: null,
      lastMessage: "Thanks for your help yesterday!",
      time: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      unread: 2,
    },
    {
      id: 2,
      name: "Emily Davis",
      avatar: null,
      lastMessage: "Could you provide more information about the premium package?",
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      unread: 0,
    },
    {
      id: 3,
      name: "Michael Brown",
      avatar: null,
      lastMessage: "I'd like to schedule a call to discuss our options.",
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      unread: 1,
    },
    {
      id: 4,
      name: "Sarah Johnson",
      avatar: null,
      lastMessage: "Just wanted to say your presentation was fantastic!",
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      unread: 0,
    },
  ];

  const sampleMessages: Message[] = [
    {
      id: 1,
      userId: 2,
      leadId: 1,
      content: "Hello, I'm interested in your premium package. Could you tell me more about it?",
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      userId: 1,
      leadId: 1,
      content: "Hi John! Absolutely, our premium package includes personalized coaching, exclusive content, and priority support. Would you like me to send you a brochure?",
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      userId: 2,
      leadId: 1,
      content: "Yes, that would be great. Please send it to my email.",
      isRead: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      userId: 1,
      leadId: 1,
      content: "I've just sent it. Let me know if you have any questions after reviewing it!",
      isRead: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      userId: 2,
      leadId: 1,
      content: "Thanks for your help yesterday!",
      isRead: false,
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
  ];

  const conversations = conversationsData?.data || sampleConversations;
  const messages = messagesData?.data || (selectedConversation === 1 ? sampleMessages : []);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // In a real app, this would be a mutation to send a message
    console.log("Sending message:", newMessage, "to conversation:", selectedConversation);
    
    // Clear input after sending
    setNewMessage("");
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Messages</h1>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations list */}
          <Card className="md:col-span-1 h-[calc(100vh-170px)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Input placeholder="Search conversations..." className="w-full" />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer mb-1 ${
                    selectedConversation === conversation.id 
                      ? "bg-brand-50 dark:bg-gray-700" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={conversation.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conversation.name}`} alt={conversation.name} />
                    <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {conversation.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getRelativeTime(conversation.time)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unread > 0 && (
                    <Badge className="ml-2 bg-brand-500">{conversation.unread}</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Messages */}
          <Card className="md:col-span-2 h-[calc(100vh-170px)] overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${
                        conversations.find(c => c.id === selectedConversation)?.name || ""
                      }`}
                      alt={conversations.find(c => c.id === selectedConversation)?.name || ""}
                    />
                    <AvatarFallback>
                      {(conversations.find(c => c.id === selectedConversation)?.name || "").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {conversations.find(c => c.id === selectedConversation)?.name}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userId === 1 ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.userId === 1
                            ? "bg-brand-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.userId === 1
                            ? "text-brand-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {getRelativeTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center">
                  <Input
                    placeholder="Type your message..."
                    className="flex-1 mr-2"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage}>Send</Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
