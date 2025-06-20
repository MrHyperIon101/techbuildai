
"use client";

import React from 'react';
import { useConversation } from '@/contexts/conversation-context';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/common/glass-card';
import { SectionTitle } from '@/components/common/section-title';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Bot, User, Settings, Trash2, FileText, BarChart3, BarChartHorizontalBig, Search as AnalysisIcon, Flame, Gauge, Brain, PackageSearch, ShieldCheck, ClipboardList } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Message, FeatureArea } from '@/lib/types';

const featureIcons: Record<FeatureArea, React.ElementType> = {
  builder: Bot,
  'components-db': FileText,
  'bottleneck-calculator': AnalysisIcon,
  general: User, // Default/General Chat
  'compatibility-checker': ShieldCheck, 
  'cinebench-scores': BarChart3,
  '3dmark-scores': BarChartHorizontalBig,
  'furmark-scores': Flame,
  'pcmark-scores': Gauge,
  'geekbench-scores': Brain,
  'aida64-scores': ClipboardList,
};

const featureNames: Record<FeatureArea, string> = {
  builder: 'AI PC Builder',
  'components-db': 'Component DB',
  'bottleneck-calculator': 'Bottleneck Calculator',
  general: 'General Chat',
  'compatibility-checker': 'Compatibility Checker',
  'cinebench-scores': 'Cinebench Scores',
  '3dmark-scores': '3DMark Scores',
  'furmark-scores': 'FurMark Scores',
  'pcmark-scores': 'PCMark Scores',
  'geekbench-scores': 'Geekbench Scores',
  'aida64-scores': 'AIDA64 Scores',
};


export default function ConversationHistoryPage() {
  const { messages, clearHistory } = useConversation();

  const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all conversation history? This action cannot be undone.')) {
      clearHistory();
    }
  };
  
  return (
    <div className="space-y-8">
      <SectionTitle>Conversation History</SectionTitle>
      <GlassCard>
        <GlassCardHeader className="flex flex-row justify-between items-center">
          <GlassCardTitle>All Interactions</GlassCardTitle>
          {messages.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClearHistory} className="rounded-full">
              <Trash2 className="mr-2 h-4 w-4" /> Clear All History
            </Button>
          )}
        </GlassCardHeader>
        <GlassCardContent>
          <ScrollArea className="h-[60vh] p-1 pr-3">
            {sortedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <PackageSearch className="w-16 h-16 text-muted-foreground mb-4" /> 
                <p className="text-muted-foreground">No conversation history yet.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Start interacting with the AI features to see your history here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMessages.map((msg) => <HistoryItem key={msg.id} message={msg} />)}
              </div>
            )}
          </ScrollArea>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

interface HistoryItemProps {
  message: Message;
}

function HistoryItem({ message }: HistoryItemProps) {
  const Icon = message.type === 'user' ? User : message.type === 'ai' ? Bot : Settings;
  const FeatureIcon = featureIcons[message.feature] || Bot;
  const cardBg = message.type === 'user' ? 'bg-primary/10' : message.type === 'ai' ? 'bg-accent/10' : 'bg-muted/20';
  const borderColor = message.type === 'user' ? 'border-primary/30' : message.type === 'ai' ? 'border-accent/30' : 'border-muted/30';

  return (
    <div className={`p-4 rounded-xl border ${borderColor} ${cardBg} shadow-sm animate-fade-in`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-6 h-6 mt-1 shrink-0 ${message.type === 'user' ? 'text-primary' : message.type === 'ai' ? 'text-accent' : 'text-muted-foreground'}`} />
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-sm">
              {message.type === 'user' ? 'You' : message.type === 'ai' ? 'TechBuild AI' : 'System'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          </div>
          {typeof message.content === 'string' ? (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm text-foreground/90">{message.content}</div>
          )}
          {message.data && (
            <div className="mt-2 p-2 bg-black/20 rounded-md text-xs overflow-x-auto">
              <p className="font-mono text-muted-foreground whitespace-pre">Associated Data: {JSON.stringify(message.data, null, 2).substring(0,250)}...</p>
            </div>
          )}
           <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <FeatureIcon className="w-3.5 h-3.5 mr-1.5" />
            <span>{featureNames[message.feature] || 'General'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

    