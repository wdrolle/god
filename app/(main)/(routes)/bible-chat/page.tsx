// app/(main)/(routes)/bible-chat/page.tsx

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Dropdown,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea
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
import { toast } from "sonner";
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
import { clsx } from "clsx";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const hasLoadedRef = useRef<{ [key: string]: boolean }>({});
  const rateLimitRef = useRef<{ [key: string]: boolean }>({});
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Separate data fetching functions
  const fetchConversationData = async (page = 1) => {
    const response = await fetch(`/api/chat/conversations?page=${page}`, {
      headers: {
        "Content-Type": "application/json"
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(response.status === 429 ? 'Rate limit reached' : 'Failed to load conversations');
    }

    return {
      data: await response.json(),
      totalCount: parseInt(response.headers.get('X-Total-Count') || '0'),
      pageCount: parseInt(response.headers.get('X-Page-Count') || '1'),
      currentPage: parseInt(response.headers.get('X-Current-Page') || '1')
    };
  };

  const fetchMessageData = async (conversationId: string) => {
    const response = await fetch(`/api/chat/messages/${conversationId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(response.status === 429 ? 'Rate limit reached' : 'Failed to fetch messages');
    }

    return await response.json();
  };

  // Declare fetchMessages before useEffect
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!session?.user || hasLoadedRef.current[conversationId] || rateLimitRef.current[conversationId]) return;

    try {
      setIsHistoryLoading(true);
      const data = await fetchMessageData(conversationId);

      if (Array.isArray(data)) {
        const combinedMessages: Message[] = data.map(msg => ({
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at
        })).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        setMessages(combinedMessages);
        hasLoadedRef.current[conversationId] = true;
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      if (error.message === 'Rate limit reached') {
        rateLimitRef.current[conversationId] = true;
        toast.error('Too Many Requests. Please try again later.');
      } else {
        setMessages([]);
        toast.error(error.message || 'Failed to fetch messages.');
      }
    } finally {
      setIsHistoryLoading(false);
    }
  }, [session?.user]);

  // Declare fetchConversations after fetchMessages
  const fetchConversations = useCallback(async (page = 1) => {
    if (!session?.user) return;

    try {
      setIsLoadingMore(true);
      const { data, pageCount, currentPage } = await fetchConversationData(page);

      if (Array.isArray(data)) {
        // Process conversations without fetching messages
        const processedData = data.map(conv => ({
          ...conv,
          god_chat_messages: [] // Initialize empty, will be loaded when conversation is selected
        }));

        setConversations(prev =>
          page === 1 ? processedData : [...prev, ...processedData]
        );

        setTotalPages(pageCount);
        setCurrentPage(currentPage);
        setHasMore(currentPage < pageCount);
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load conversations');
    } finally {
      setIsLoadingMore(false);
    }
  }, [session?.user]);

  // Consolidate initialization effects into one
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (isInitialized || !session?.user || status !== 'authenticated') return;

      try {
        await fetchUserName();
        await fetchConversations();
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [session, status, isInitialized, fetchConversations]);

  // Replace existing message fetching effect with a more controlled one
  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      if (!currentConversation || !session?.user || !isInitialized || isHistoryLoading) return;

      if (!hasLoadedRef.current[currentConversation] && !rateLimitRef.current[currentConversation]) {
        await fetchMessages(currentConversation);
      }
    };

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [currentConversation, session?.user, isInitialized, isHistoryLoading, fetchMessages]);

  // Add scroll to bottom effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Add function to fetch user's name
  const fetchUserName = async () => {
    try {
      const sessionData = await getSession();
      if (!sessionData?.user?.id) return;

      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setFirstName(data.first_name || "friend");
      } else if (response.status === 429) {
        toast.error('Too Many Requests. Please try again later.');
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
      toast.error('Failed to fetch user name.');
    }
  };

  // Add load more function
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchConversations(currentPage + 1);
  }, [currentPage, hasMore, isLoadingMore, fetchConversations]);

  const createNewConversation = async (): Promise<string | null> => {
    try {
      const title = "Chat_" + new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace(/[/,]/g, '-').replace(' ', '_');

      console.log('DEBUG: Creating new conversation with title:', title);

      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ title })
      });

      console.log('DEBUG: Response status:', response.status);

      const data = await response.json();
      console.log('DEBUG: Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create conversation');
      }

      if (!data.id) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      // Add the new conversation to the state
      setConversations(prev => [...prev, data]);
      setCurrentConversation(data.id);
      setMessages([]);
      return data.id;
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create conversation");
      return null;
    }
  };

  const typeResponse = async (response: string) => {
    setIsTyping(true);
    const paragraphs = response.split(/\n\n+/);
    let currentText = '';

    for (let paragraph of paragraphs) {
      // Skip empty paragraphs
      if (!paragraph.trim()) continue;

      // Add double newline before paragraph
      if (currentText) {
        currentText += '\n\n';
        setDisplayedResponse(currentText);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Type out the paragraph
      const words = paragraph.split(' ');
      for (let word of words) {
        currentText += word + ' ';
        setDisplayedResponse(currentText);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }

    setIsTyping(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isMessageLoading) return;

    try {
      setIsMessageLoading(true);

      // Create new chat if needed
      if (!currentConversation) {
        const newConvId = await createNewConversation();
        if (!newConvId) {
          throw new Error('Failed to create conversation');
        }
        setCurrentConversation(newConvId);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure state is updated
      }

      if (!currentConversation) {
        throw new Error('No active conversation');
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
          conversationId: currentConversation,
          firstName: firstName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Rate limit reached. Please try again later.');
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      if (!data.message) {
        throw new Error('No message received from AI');
      }

      // Format the AI response with markdown and proper spacing
      const formattedMessage = data.message.trim();

      // Create temporary message for typing effect
      const tempMessage: Message = {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);

      // Start typing effect
      await typeResponse(formattedMessage);

      // Update the message with complete response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: formattedMessage
        };
        return newMessages;
      });

      // Update conversation title if it's a new chat
      const currentConv = conversations.find(conv => conv.id === currentConversation);
      if (currentConv?.title.startsWith("Chat_")) {
        const title = "Chat_" + new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).replace(/[/,]/g, '-').replace(' ', '_');
        await updateConversationTitle(currentConversation, title);
      }

      // After successful message send
      setShouldRefresh(true);

    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.message || 'Failed to send message');

      const errorMessage = `### Error

I apologize, ${firstName}, but I'm having trouble responding right now. Please try again later.

---

*If this problem persists, please contact support.*

With care,
Zoe 🙏`;

      setMessages(prev => [...prev, {
        role: "assistant",
        content: errorMessage,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsMessageLoading(false);
      setDisplayedResponse("");
    }
  };

  const updateConversationTitle = async (conversationId: string | null, newTitle: string) => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation title');
      }

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, title: newTitle }
            : conv
        )
      );
    } catch (error) {
      console.error("Error updating conversation title:", error);
      // Don't show error toast for title update failure
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
      // Delete conversation and its messages
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
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

  // Update conversation selection handler
  const handleConversationSelect = useCallback((conversationId: string) => {
    setCurrentConversation(conversationId);
    if (!hasLoadedRef.current[conversationId] && !rateLimitRef.current[conversationId]) {
      fetchMessages(conversationId);
    }
  }, [fetchMessages]);

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
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
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
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                  onClick={() => handleConversationSelect(conv.id)}
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
                            if (isUpdating) return; // Prevent clicks while updating
                            setEditTitle(conv.title);
                            setIsEditModalOpen(true);
                          }}
                          disabled={isUpdating}
                          className={clsx(
                            "p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors",
                            isUpdating && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isUpdating ? (
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                          ) : (
                            <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(conv.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="w-full mt-4 p-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center justify-center">
                      <Clock className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              )}

              {/* Retry Button for Rate Limited Conversations */}
              {currentConversation && rateLimitRef.current[currentConversation] && (
                <div className="text-center mt-4">
                  <p className="text-red-500">You have reached the maximum number of requests. Please try again later.</p>
                  <Button onClick={() => { rateLimitRef.current[currentConversation] = false; fetchMessages(currentConversation); }}>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="col-span-9 flex flex-col h-[calc(80vh-2rem)]">
            <div className="flex-1 overflow-y-auto px-4 space-y-4">
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Clock className="animate-spin h-6 w-6 text-blue-600" />
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-transparent text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div
                          className="prose dark:prose-invert max-w-none whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: marked(
                              message === messages[messages.length - 1] && isTyping
                                ? displayedResponse
                                : message.content,
                              {
                                breaks: true,
                                gfm: true,
                                smartLists: true,
                                smartypants: true,
                                mangle: false,
                                headerIds: false
                              }
                            )
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isMessageLoading}
                  classNames={{
                    input: "px-4 py-2 whitespace-pre-wrap break-words",
                    inputWrapper: "px-1"
                  }}
                  minRows={1}
                  maxRows={4}
                />
                <Button 
                  type="submit" 
                  disabled={isMessageLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors px-6"
                >
                  {isMessageLoading ? (
                    <span className="flex items-center gap-2">
                      <Clock className="animate-spin h-4 w-4" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
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
                  disabled={isUpdating}
                  className={clsx(
                    "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors",
                    isUpdating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateConversationTitle(currentConversation, editTitle);
                    setIsEditModalOpen(false);
                  }}
                  disabled={isUpdating}
                  className={clsx(
                    "bg-blue-600 hover:bg-blue-700 text-white transition-colors",
                    isUpdating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isUpdating ? (
                    <span className="flex items-center gap-2">
                      <Clock className="animate-spin h-4 w-4" />
                      Updating...
                    </span>
                  ) : (
                    "Save"
                  )}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogCancel 
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setConversationToDelete(null);
              }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
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
