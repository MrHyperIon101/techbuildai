"use client";

import { ConversationProvider } from "@/contexts/conversation-context";
import React from "react";

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConversationProvider>
      {children}
    </ConversationProvider>
  );
};

export default AppProviders;
