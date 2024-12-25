// app/(main)/(routes)/bible-chat/page.tsx
// Updated to use transparent backgrounds for buttons and user text bubble,
// while keeping dark/light theme-aware text colors. AI responses still use markdown.

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Dropdown,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@nextui-org/react";
import { Send, Edit2, Clock, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from '@/lib/hooks/use-theme';
import { marked } from "marked";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { StyledInput } from "@/components/ui/styled-input";
import dynamic from "next/dynamic";
import { generateResponse } from "@/lib/utils/ollama";
import { getSession } from "next-auth/react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  god_chat_messages?: Message[];
}

// Add dynamic import for theme toggle
const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then(mod => mod.ThemeToggle),
  {
    ssr: false,
  }
);

export default function BibleChatPage() {
  const { theme } = useTheme(); // Access the current theme
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const [firstName, setFirstName] = useState<string>("friend");
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation);
    }
  }, [currentConversation]);

  // Add function to fetch user's name
  const fetchUserName = async () => {
    try {
      const session = await getSession();
      if (!session?.user?.id) return;

      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setFirstName(data.first_name || "friend");
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  // Add to useEffect
  useEffect(() => {
    fetchUserName();
  }, []);

  // Memoize fetchConversations to prevent unnecessary rerenders
  const fetchConversations = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch("/api/chat/conversations", {
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('Could not fetch conversations, starting fresh');
        setConversations([]);
        return;
      }
      
      const data = await response.json();
      
      // Validate the data structure
      if (Array.isArray(data)) {
        setConversations(data);
        
        // Only fetch messages if we have a current conversation
        if (currentConversation) {
          const currentConv = data.find((conv: Conversation) => conv.id === currentConversation);
          if (currentConv?.god_chat_messages) {
            setMessages(currentConv.god_chat_messages);
          }
        }
      } else {
        console.warn('Invalid conversations data format, starting fresh');
        setConversations([]);
      }
    } catch (error) {
      console.warn('Error fetching conversations, starting fresh:', error);
      setConversations([]);
    }
  }, [session?.user, currentConversation]);

  // Update fetchMessages to handle errors silently
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/chat/messages/${conversationId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('Could not fetch messages, starting fresh');
        setMessages([]);
        return;
      }
      
      const data = await response.json();
      
      // Validate the data structure
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        console.warn('Invalid messages data format, starting fresh');
        setMessages([]);
      }
    } catch (error) {
      console.warn('Error fetching messages, starting fresh:', error);
      setMessages([]);
    }
  }, [session?.user]);

  // Update useEffect to handle session and loading states properly
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (status === 'loading') return;
      
      if (!session?.user) {
        router.push('/auth/signin');
        return;
      }

      if (mounted) {
        await fetchConversations();
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [session, status, router, fetchConversations]);

  // Update conversation effect to prevent unnecessary calls
  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      if (currentConversation && mounted && session?.user) {
        await fetchMessages(currentConversation);
      }
    };

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [currentConversation, session?.user, fetchMessages]);

  const createNewConversation = async (): Promise<Conversation | null> => {
    if (status === 'loading') return null;
    
    if (!session?.user) {
      toast.error('Please sign in to create a conversation');
      return null;
    }

    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include'  // Important for session handling
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create conversation');
      }

      const data = await response.json();
      setConversations(prev => [...prev, data]);
      setCurrentConversation(data.id);
      setMessages([]);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  };

  // Add this function to handle the API call
  const updateConversationTitleAPI = async (conversationId: string, newTitle: string) => {
    console.log('DEBUG: Starting title update for conversation:', conversationId);
    console.log('DEBUG: New title:', newTitle);
    
    if (!session?.user) {
      throw new Error('Please sign in to update conversation titles');
    }

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle.trim() }),
        credentials: 'include'
      });

      console.log('DEBUG: Response status:', response.status);
      const responseText = await response.text();
      console.log('DEBUG: Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('DEBUG: Error parsing response:', parseError);
        console.error('DEBUG: Response text:', responseText);
        throw new Error(`Server error: ${responseText}`);
      }

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to update conversation title';
        console.error('DEBUG: API error:', errorMessage);
        if (data.details) {
          console.error('DEBUG: Error details:', data.details);
        }
        throw new Error(errorMessage);
      }

      console.log('DEBUG: Successfully updated conversation:', data);
      return data;
    } catch (error) {
      console.error('DEBUG: Error in updateConversationTitleAPI:', error);
      throw error;
    }
  };

  // Update the existing updateConversationTitle function
  const updateConversationTitle = async () => {
    try {
      if (!currentConversation || !editTitle) {
        toast.error('Invalid conversation or title');
        return;
      }

      const updatedConversation = await updateConversationTitleAPI(
        currentConversation,
        editTitle
      );

      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversation
            ? { ...conv, title: editTitle }
            : conv
        )
      );

      setIsEditModalOpen(false);
      setEditTitle('');
      toast.success('Conversation title updated');
    } catch (error: any) {
      console.error('Error updating title:', error);
      toast.error(error.message || 'Failed to update conversation title');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);

      // Create new conversation if needed
      if (!currentConversation) {
        const newConv = await createNewConversation();
        if (!newConv) {
          throw new Error('Failed to create conversation');
        }
      }

      // Add user message immediately
      const userMessage: Message = {
        role: "user",
        content: input.trim(),
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput("");

      // Get AI response
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          conversationId: currentConversation
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      if (!data.message) {
        throw new Error('No message received from AI');
      }

      // Add AI response to messages
      const aiMessage: Message = {
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      
      const errorMessage = `
### Error

I apologize, but I'm having trouble responding right now. Please try again later.

---
*If this problem persists, please contact support.*
      `.trim();

      setMessages(prev => [...prev, {
        role: "assistant",
        content: errorMessage,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add helper function to get auth token
  const getAuthToken = async () => {
    const supabase = createClientComponentClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete conversation');
      }

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If the deleted conversation was the current one, clear it
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      toast.success('Conversation deleted');
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(error.message || 'Failed to delete conversation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-2 lg:px-8 py-0">
      {/* Chat Section */}
      <div className="bg-card dark:bg-card rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-semibold mb-4">
          Bible Chat
        </h2>

        <div className="grid grid-cols-12 gap-4">
          {/* Conversation Sidebar */}
          <div className="col-span-3 border-r border-gray-200 dark:border-gray-700 pr-4">
            <Button
              className="w-full mb-4 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={createNewConversation}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>

            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer ${
                    currentConversation === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setCurrentConversation(conv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conv.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    {currentConversation === conv.id && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTitle(conv.title);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(conv.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="p-1 hover:bg-accent rounded text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="col-span-9 flex flex-col h-[calc(80vh-2rem)]">
            <div className="flex-1 overflow-y-auto px-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: marked(message.content, {
                            breaks: true,
                            gfm: true,
                            smartLists: true,
                            smartypants: true
                          })
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {format(new Date(message.created_at), "h:mm a")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Clock className="animate-spin h-4 w-4 mr-2" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Title Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditTitle('');
        }}
        classNames={{
          base: "bg-white dark:bg-gray-800",
          header: "text-gray-900 dark:text-gray-100",
          body: "text-gray-700 dark:text-gray-300",
          footer: "border-t border-gray-200 dark:border-gray-700",
          closeButton: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-200 dark:border-gray-700">
                Edit Conversation Title
              </ModalHeader>
              <ModalBody>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter new title"
                  classNames={{
                    input: "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
                    inputWrapper: "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="flat" 
                  onPress={onClose}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={updateConversationTitle}
                  className="bg-blue-600 dark:bg-blue-500 text-white"
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add the delete confirmation dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setConversationToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (conversationToDelete) {
                  deleteConversation(conversationToDelete);
                  setIsDeleteDialogOpen(false);
                  setConversationToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
