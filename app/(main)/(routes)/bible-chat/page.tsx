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
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data);

      // Only fetch messages if we have a current conversation
      if (currentConversation) {
        const currentConv = data.find((conv: Conversation) => conv.id === currentConversation);
        if (currentConv?.god_chat_messages) {
          setMessages(currentConv.god_chat_messages);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to fetch conversations');
    }
  }, [session?.user, currentConversation]);

  // Memoize fetchMessages to prevent unnecessary rerenders
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/chat/messages/${conversationId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
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

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI immediately
    const userMessageWithTime: Message = {
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessageWithTime]);
    
    setIsLoading(true);

    try {
      // Get or create conversation
      let chatId = currentConversation;
      if (!chatId) {
        const newConv = await createNewConversation();
        if (!newConv) throw new Error('Failed to create conversation');
        chatId = newConv.id;
        setCurrentConversation(chatId);
      }

      // Get AI response
      const response = await fetch("/api/bible-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: chatId
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      
      const data = await response.json();
      
      // Add AI response to UI
      const aiMessageWithTime: Message = {
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessageWithTime]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again later.",
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
    <div className="w-full h-[calc(95vh-2rem)] flex gap-4 px-4 overflow-hidden">
      {/* Theme Toggle - Absolute positioned */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Conversation Sidebar - Fixed width and full height */}
      <div className="w-[250px] h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 overflow-y-auto">
        {/* New Chat Button with Transparent Background and Theme-based Text */}
        <Button
          className={`mb-4 w-full bg-transparent 
            ${theme === 'dark' ? 'text-white' : 'text-black'} 
            hover:bg-gray-100 dark:hover:bg-gray-700
          `}
          variant="light"
          startContent={<Plus />}
          onPress={createNewConversation}
        >
          New Chat
        </Button>

        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-2 rounded-lg cursor-pointer flex items-center justify-between ${
                currentConversation === conv.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setCurrentConversation(conv.id)}
            >
              <div 
                className="flex-1"
                onClick={() => setCurrentConversation(conv.id)}
              >
                <div className="flex flex-col">
                  <span className="font-medium truncate">{conv.title}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(conv.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              </div>
              {currentConversation === conv.id && (
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setEditTitle(conv.title);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-red-500 hover:text-red-600"
                    onPress={() => {
                      setConversationToDelete(conv.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area - Flex grow and full height */}
      <div className="flex-1 h-full bg-white dark:bg-gray-800/95 rounded-lg shadow-sm flex flex-col">
        {/* Messages - Scrollable area that takes remaining height */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 markdown-body">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[95%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-gray-100 dark:bg-gray-700"
                    : "bg-gray-100 dark:bg-gray-700"
                } shadow-sm`}
              >
                {message.role === "assistant" ? (
                  <div
                    className="markdown-content prose dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: marked(message.content, {
                        breaks: true,
                        gfm: true
                      })
                    }}
                  />
                ) : (
                  <div className="text-gray-900 dark:text-gray-100">
                    {message.content}
                  </div>
                )}
                {message.created_at && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {format(new Date(message.created_at), "h:mm a")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input form - Fixed height at bottom */}
        <div className="border-t dark:border-gray-700/50 bg-white/10 dark:bg-gray-900/50 p-4 mt-auto">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <StyledInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for guidance..."
                isClearable
                fullWidth
                size="lg"
                aria-label="Ask for guidance"
                className="bg-transparent dark:bg-transparent"
                classNames={{
                  input: "px-4 py-2",
                  inputWrapper: "bg-transparent dark:bg-transparent px-6 py-4"
                }}
                minRows={1}
                maxRows={4}
              />
              <Button
                type="submit"
                isLoading={isLoading}
                className="bg-transparent hover:bg-blue-500/10 
                  dark:hover:bg-blue-600/20 text-blue-600 dark:text-blue-400
                  h-12 px-4 min-w-[120px] flex items-center justify-center gap-2"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
                <span>Send</span>
              </Button>
            </div>
          </form>
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
