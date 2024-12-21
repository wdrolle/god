// app/(main)/(routes)/bible-chat/page.tsx
// This file is used to handle the bible chat page
// It is used to display the bible chat page

"use client";

import React, { useState, useEffect } from "react";
import { Button, Dropdown, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { Send, Edit2, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { marked } from "marked";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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

export default function BibleChatPage() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
    const response = await fetch("/api/chat/conversations");
    if (response.ok) {
      const data = await response.json();
      setConversations(data);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const response = await fetch(`/api/chat/messages/${conversationId}`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data);
    }
  };

  const createNewConversation = async () => {
    const response = await fetch("/api/chat/conversations", {
      method: "POST",
    });
    if (response.ok) {
      const data = await response.json();
      setConversations(prev => [...prev, data]);
      setCurrentConversation(data.id);
      setMessages([]);
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
      const data = await response.json();
      setConversations(prev =>
        prev.map(conv => conv.id === currentConversation ? { ...conv, title: editTitle } : conv)
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
      // Try to get current conversation or create new one
      let chatId = currentConversation;
      if (!chatId) {
        try {
          const convResponse = await fetch("/api/chat/conversations", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              // Add authorization header
              "Authorization": `Bearer ${await getAuthToken()}`
            },
          });
          
          if (!convResponse.ok) {
            const errorData = await convResponse.json();
            throw new Error(errorData.error || "Failed to create conversation");
          }
          
          const convData = await convResponse.json();
          chatId = convData.id;
          setCurrentConversation(chatId);
          setConversations(prev => [...prev, convData]);
        } catch (error) {
          console.error("Conversation creation error:", error);
          throw new Error("Failed to create conversation");
        }
      }

      // Send message with authorization
      const response = await fetch("/api/bible-chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: chatId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
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
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  return (
    <div className="w-full flex gap-4 px-4">
      {/* Conversation Sidebar - 15% width */}
      <div className="w-[15%] bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <Button
          className="w-full mb-4"
          color="primary"
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

      {/* Chat Area - 70% width */}
      <div className="w-[85%] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {/* Messages */}
        <div className="h-[600px] overflow-y-auto p-6 space-y-4 markdown-body">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-6 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-700 prose dark:prose-invert"
                }`}
              >
                {message.role === "assistant" ? (
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ 
                      __html: marked(message.content, {
                        breaks: true,
                        gfm: true
                      }) 
                    }} 
                  />
                ) : (
                  message.content
                )}
                {message.created_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(message.created_at), "h:mm a")}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="border-t dark:border-gray-700 p-6">
          <div className="flex gap-4 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for guidance..."
              className="flex-1"
            />
            <Button
              type="submit"
              isLoading={isLoading}
              className="bg-primary text-white h-12 px-6 min-w-[120px] flex items-center justify-center"
            >
              <Send className="h-5 w-5 mr-2" />
              Send
            </Button>
          </div>
        </form>
      </div>

      {/* Edit Title Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Edit Conversation Title</ModalHeader>
              <ModalBody>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter new title"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={updateConversationTitle}>
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