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
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  god_chat_messages?: Message[];
}

interface ChatMessage {
  id: number;
  conversation_id: string;
  messages: {
    user_content: {
      role: "user";
      content: string;
      timestamp: string;
    };
    ai_content: {
      role: "assistant";
      content: string;
      timestamp: string;
    };
  }[];
  created_at: string;
}

interface DatabaseMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface MessageResponse {
  messages: {
    user_content?: {
      role: string;
      content: string;
      timestamp: string;
    };
    ai_content?: {
      role: string;
      content: string;
      timestamp: string;
    };
  }[];
  id: number;
}

// Add dynamic import for theme toggle
const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then(mod => mod.ThemeToggle),
  {
    ssr: false,
  }
);

// Add debounce utility
const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};

// Add profile cache
const profileCache = {
  data: null as any,
  timestamp: 0
};

// Add retry utility
const retry = async <T,>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * backoff, backoff);
  }
};

// Add rate limiting and caching utilities
const API_COOLDOWN = 1000; // 1 second between requests
const CACHE_DURATION = 30000; // 30 seconds cache duration

// Add interface for AI response
interface AIResponse {
  response: string;
  model: string;
  created_at: string;
}

// Add interface for generate response input
interface GenerateResponseInput {
  prompt: string;
}

// Add type for generate response function
type GenerateResponseFn = (input: GenerateResponseInput) => Promise<AIResponse>;

export default function BibleChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State declarations
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [firstName, setFirstName] = useState<string>("friend");
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<{ [key: string]: number }>({});
  const [tempMessages, setTempMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCache = useRef<{ [key: string]: { messages: Message[]; timestamp: number } }>({});
  const fetchInProgress = useRef<{ [key: string]: boolean }>({});

  // Update fetchUserName with retry logic
  const fetchUserName = useCallback(async () => {
    try {
      // Use cached data if less than 5 minutes old
      if (profileCache.data && (Date.now() - profileCache.timestamp) < 300000) {
        setFirstName(profileCache.data.first_name || "friend");
        return;
      }

      const response = await retry(async () => {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res;
      });

      const data = await response.json();
      profileCache.data = data;
      profileCache.timestamp = Date.now();
      setFirstName(data.first_name || "friend");
    } catch (error) {
      console.error("Error fetching user name:", error);
      setFirstName("friend"); // Fallback
    }
  }, []);

  // Type AI response
  const typeResponse = useCallback(async (response: string) => {
    setIsTyping(true);
    const paragraphs = response.split(/\n\n+/);
    let currentText = '';

    for (let paragraph of paragraphs) {
      if (!paragraph.trim()) continue;
      if (currentText) {
        currentText += '\n\n';
        setDisplayedResponse(currentText);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const words = paragraph.split(' ');
      for (let word of words) {
        currentText += word + ' ';
        setDisplayedResponse(currentText);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    setIsTyping(false);
  }, []);

  // Update fetchMessages with better rate limiting and caching
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!conversationId || fetchInProgress.current[conversationId]) return;
    
    fetchInProgress.current[conversationId] = true;
    
    try {
      const res = await fetch(`/api/chat/messages/${conversationId}`);
      
      if (res.status === 429) {
        console.log('Rate limited, using cache if available');
        if (messageCache.current[conversationId]) {
          setMessages(messageCache.current[conversationId].messages);
          return;
        }
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchMessages(conversationId);
      }
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch messages');
      }

      const data = await res.json();
      
      // Process messages
      const processedMessages = data.flatMap((msg: any) => {
        if (!msg.messages || !Array.isArray(msg.messages)) return [];
        
        return msg.messages.map((message: any, index: number) => ({
          id: msg.id * 100 + index, // Ensure unique IDs
          role: message.role,
          content: message.content,
          timestamp: message.timestamp || msg.created_at
        }));
      });

      // Sort messages by timestamp
      const sortedMessages = processedMessages.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Update cache and state
      messageCache.current[conversationId] = {
        messages: sortedMessages,
        timestamp: Date.now()
      };
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      fetchInProgress.current[conversationId] = false;
    }
  }, []);

  // Update fetchConversations with retry logic
  const fetchConversations = useCallback(async () => {
    if (!session?.user?.id || isLoading) return;
    
    try {
      const response = await retry(async () => {
        const res = await fetch("/api/chat/conversations");
        if (!res.ok) throw new Error('Failed to fetch conversations');
        return res;
      });
      
      const data = await response.json();
      setConversations(data);
      
      // If there are conversations and none selected, select the first one
      if (data.length && !currentConversation) {
        setCurrentConversation(data[0].id);
        await fetchMessages(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  }, [session?.user?.id, isLoading, currentConversation, fetchMessages]);

  // Update initialization effect
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized || status !== "authenticated" || !session?.user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch user name and conversations sequentially to avoid rate limits
        await retry(async () => {
          await fetchUserName();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          await fetchConversations();
        });
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [status, session, isInitialized, fetchConversations, fetchUserName]);

  // Update handleConversationSelect to handle message loading better
  const handleConversationSelect = useCallback((conversationId: string) => {
    setCurrentConversation(conversationId);
    
    // Always show cached messages first if available
    if (messageCache.current[conversationId]) {
      console.log('Showing cached messages immediately');
      setMessages(messageCache.current[conversationId].messages);
      return; // Don't fetch if we have cached messages
    }

    // Only fetch if we don't have cached messages
    setMessages([]); // Clear messages while loading
    
    // Add a small delay before fetching to prevent rate limiting
    setTimeout(() => {
      if (!fetchInProgress.current[conversationId]) {
        fetchMessages(conversationId);
      }
    }, 500);
  }, [fetchMessages]);

  // Update message loading effect to prevent excessive retries
  useEffect(() => {
    if (!isInitialized || !session?.user || !currentConversation) return;
    
    const initializeMessages = async () => {
      if (!messageCache.current[currentConversation] && !fetchInProgress.current[currentConversation]) {
        try {
          await fetchMessages(currentConversation);
        } catch (error) {
          console.error('Error initializing messages:', error);
        }
      }
    };

    initializeMessages();
  }, [isInitialized, session?.user, currentConversation, fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const createNewConversation = async () => {
    try {
      const title = `Chat_${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/[/,]/g, '-').replace(/:/g, '-').replace(' ', '_')}`;

      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to create conversation:', error);
        throw new Error(error.message || "Failed to create conversation");
      }

      const newConv = await res.json();
      
      // Update conversations state
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv.id);
      
      // Set initial messages if they exist
      if (newConv.god_chat_messages?.length) {
        const messages = newConv.god_chat_messages.flatMap((msg: any) => {
          if (!msg.messages || !Array.isArray(msg.messages)) return [];
          
          return msg.messages.map((message: any, index: number) => ({
            id: msg.id * 100 + index,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp || msg.created_at
          }));
        });
        setMessages(messages);
      } else {
        setMessages([]);
      }

      return newConv.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast.error(error.message || 'Failed to create new conversation');
      return null;
    }
  };

  // Update delete conversation to clear cache
  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete conversation');
      }

      // Clear cache and update state
      delete messageCache.current[conversationId];
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

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

  const updateConversationTitle = async (conversationId: string | null, newTitle: string) => {
    if (!conversationId) return;
    setIsUpdating(true);
    
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });

      if (!res.ok) throw new Error("Failed to update title");
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, title: newTitle }
            : conv
        )
      );
      
      setIsEditModalOpen(false);
      setEditTitle("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update handleSubmit with proper message format
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isMessageLoading) return;
    
    setIsMessageLoading(true);
    const userMessage = input.trim();
    setInput(""); // Clear input immediately after getting the value
    
    try {
      // Create conversation if needed
      if (!currentConversation) {
        const newConvId = await createNewConversation();
        if (!newConvId) throw new Error("Failed to create conversation");
        setCurrentConversation(newConvId);
      }

      // Add user message to UI immediately
      const userMessageObj: Message = {
        id: Date.now(),
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessageObj]);

      // Generate AI response using Llama
      const llamaResponse = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: `You are a wise and knowledgeable theologian, well-versed in biblical scripture, theological concepts, and spiritual guidance. Your responses should:
          1. Draw from biblical wisdom and scripture
          2. Provide thoughtful spiritual guidance
          3. Reference relevant Bible verses when appropriate
          4. Explain complex theological concepts clearly
          5. Maintain a respectful and pastoral tone
          6. Encourage spiritual growth and understanding

          Question: ${userMessage}

          Please provide a theological response that addresses the spiritual aspects of the question and offers biblical wisdom and guidance.`,
          stream: false,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!llamaResponse.ok) {
        console.error('Llama API error:', await llamaResponse.text());
        throw new Error(`Llama API error: ${llamaResponse.status}`);
      }

      const llamaData = await llamaResponse.json();
      console.log('Llama response:', llamaData);

      if (!llamaData.response) {
        console.error('Invalid Llama response:', llamaData);
        throw new Error('Invalid response from Llama');
      }

      const aiResponse = llamaData.response;

      // Only save to database if we have a valid AI response
      if (!aiResponse.trim()) {
        throw new Error('Empty AI response');
      }

      // Save both messages to database
      const messageData = {
        conversationId: currentConversation,
        messages: [
          {
            id: uuidv4(),
            user_content: {
              role: "user",
              content: userMessage,
              timestamp: new Date().toISOString()
            },
            ai_content: {
              role: "assistant",
              content: aiResponse,
              timestamp: new Date().toISOString()
            }
          }
        ]
      };

      console.log('Sending message data:', JSON.stringify(messageData, null, 2));

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save message");
      }

      // Add AI response to UI
      const aiMessageObj: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessageObj]);

      // Type out the AI response
      await typeResponse(aiResponse);

    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast.error(error.message || 'Failed to send message');
      // Add error message to UI
      const errorMessage: Message = {
        id: Date.now(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsMessageLoading(false);
    }
  }, [input, currentConversation, isMessageLoading, typeResponse, createNewConversation]);

  // Update message display to handle timestamps safely
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return format(new Date(), "h:mm a");
      }
      return format(date, "h:mm a");
    } catch (error) {
      return format(new Date(), "h:mm a");
    }
  };

  function processMessages(data: ChatMessage[]): Message[] {
    setIsProcessing(true);
    const allMessages: Message[] = [];

    try {
      data.forEach(messageRow => {
        if (messageRow.messages && Array.isArray(messageRow.messages)) {
          messageRow.messages.forEach(msg => {
            // Process user message
            if (msg.user_content) {
              allMessages.push({
                id: allMessages.length,
                role: "user",
                content: msg.user_content.content,
                timestamp: msg.user_content.timestamp
              });
            }
            // Process AI message and format markdown
            if (msg.ai_content) {
              const formattedContent = msg.ai_content.content
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');

              allMessages.push({
                id: allMessages.length,
                role: "assistant",
                content: formattedContent,
                timestamp: msg.ai_content.timestamp
              });
            }
          });
        }
      });

      // Sort messages by timestamp
      const sortedMessages = allMessages.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return sortedMessages;

    } catch (error) {
      console.error('Error processing messages:', error);
      setIsProcessing(false);
      return [];
    }
  }

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
            </div>
          </div>

          {/* Chat Messages */}
          <div className="col-span-9 flex flex-col h-[calc(80vh-2rem)]">
            <div className="flex-1 overflow-y-auto px-4 space-y-4">
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Clock className="animate-spin h-6 w-6 text-blue-600" />
                </div>
              ) : isProcessing ? (
                // Show temporary messages while processing
                tempMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } opacity-50 transition-opacity duration-200`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(message.timestamp), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Show final processed messages
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div
                          className="prose dark:prose-invert max-w-none whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: marked(message.content, {
                              breaks: true,
                              gfm: true,
                              smartLists: true,
                              smartypants: true,
                              headerIds: false
                            })
                          }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                          {message.content}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(message.timestamp), "MMM d, h:mm a")}
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
