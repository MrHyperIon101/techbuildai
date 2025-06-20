
"use client";

import type { Message, FeatureArea } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ConversationContextType {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearHistory: (feature?: FeatureArea) => void;
  getMessagesByFeature: (feature: FeatureArea) => Message[];
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'techbuild-ai-conversation-history';

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Failed to load messages from localStorage:", error);
      setMessages([]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save messages to localStorage:", error);
      }
    }
  }, [messages, isLoaded]);

  const addMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  }, []);

  const clearHistory = useCallback((feature?: FeatureArea) => {
    setMessages((prevMessages) => 
      feature ? prevMessages.filter(msg => msg.feature !== feature) : []
    );
  }, []);

  const getMessagesByFeature = useCallback((feature: FeatureArea) => {
    return messages.filter(msg => msg.feature === feature).sort((a, b) => a.timestamp - b.timestamp);
  }, [messages]);

  return (
    <ConversationContext.Provider value={{ messages, addMessage, clearHistory, getMessagesByFeature }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
