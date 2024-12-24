// app/(main)/(routes)/bible-chat/page.tsx
// Updated to use transparent backgrounds for buttons and user text bubble,
// while keeping dark/light theme-aware text colors. AI responses still use markdown.

"use client";

import React, { useState, useEffect } from "react";
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
import { Send, Edit2, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from '@/lib/hooks/use-theme';
import { marked } from "marked";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { StyledInput } from "@/components/ui/styled-input";
import dynamic from "next/dynamic";
import { generateResponse } from "@/lib/utils/ollama";
import { getSession } from "next-auth/react";
import { useSession } from "next-auth/react";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
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
  const { data: session } = useSession();

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

  const fetchConversations = async () => {
    try {
      const session = await getSession();
      
      if (!session?.user?.id) {
        throw new Error('No session found');
      }

      const response = await fetch("/api/chat/conversations", {
        headers: {
          "Authorization": `Bearer ${session.user.id}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const response = await fetch(`/api/chat/messages/${conversationId}`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data);
    }
  };

  const createNewConversation = async (): Promise<Conversation | null> => {
    try {
      const session = await getSession();
      
      if (!session?.user?.id) {
        throw new Error('No session found');
      }

      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.id}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Conversation creation error:', error);
        throw new Error(error.message || 'Failed to create conversation');
      }

      const data = await response.json();
      setConversations(prev => [...prev, data]);
      setCurrentConversation(data.id);
      setMessages([]);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const updateConversationTitle = async () => {
    if (!currentConversation || !editTitle) return;

    const response = await fetch(`/api/chat/conversations/${currentConversation}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });

    if (response.ok) {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversation ? { ...conv, title: editTitle } : conv
        )
      );
      setIsEditModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const session = await getSession();
      if (!session?.user) {
        throw new Error('No session found');
      }

      // Get or create conversation
      let chatId = currentConversation;
      if (!chatId) {
        const newConv = await createNewConversation();
        if (!newConv) {
          throw new Error('Failed to create conversation');
        }
        chatId = newConv.id;
      }

      // Generate AI response using Ollama
      const prompt = `${messages.map(msg => 
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n')}
      Human: ${userMessage}
      Assistant:`;

      const aiResponse = await generateResponse(prompt);

      if (!aiResponse) {
        throw new Error('Failed to generate response');
      }

      // Save messages to the conversation
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.id}`
        },
        body: JSON.stringify({
          conversation_id: chatId,
          messages: [
            {
              role: "user",
              content: userMessage,
              created_at: new Date().toISOString()
            },
            {
              role: "assistant",
              content: aiResponse,
              created_at: new Date().toISOString()
            }
          ]
        })
      });

      // Update UI with response
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again later."
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
              <div className="flex flex-col">
                <span className="font-medium truncate">{conv.title}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(conv.created_at), "MMM d, yyyy h:mm a")}
                </span>
              </div>
              {currentConversation === conv.id && (
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
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
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
        onClose={() => setIsEditModalOpen(false)}
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
    </div>
  );
}
