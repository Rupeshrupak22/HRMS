'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, Bot, User, Lock } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
}

export function AiCopilotDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Role-based suggested questions
  const getSuggestions = () => {
    const email = user?.email?.toLowerCase() || '';
    if (email === 'veena@adyapan.com' || user?.specialization === 'ONBOARDING_HIRING') {
      return '- *How many candidates are in pipeline?*\n- *Show recruitment status*\n- *What is the onboarding progress?*';
    }
    if (email === 'charitha@adyapan.com' || user?.specialization === 'SALARY_PAYROLL') {
      return '- *Show total payroll budget*\n- *How many employees are active?*\n- *What is pending salary processing?*';
    }
    return '- *How many employees are absent today?*\n- *Show pending leave approvals*\n- *What is the total employee count?*';
  };

  const [messages, setMessages] = useState<Message[]>([]);

  // Update welcome message when user changes
  React.useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello ${user?.firstName || 'there'}! I am **Adyapan HR AI Copilot**.\nHow can I assist you today?\n\nSuggested questions:\n${getSuggestions()}`,
      },
    ]);
  }, [user?.firstName, user?.email]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!query.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = query;
    setQuery('');
    setLoading(true);

    try {
      const res = await apiRequest('/ai/copilot/query', {
        method: 'POST',
        body: JSON.stringify({ query: currentQuery }),
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer || res.message,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: err.message || 'Failed to process AI query.',
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl saffron-gradient flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Adyapan HR AI Copilot</div>
              <div className="text-[10px] text-orange-600 font-semibold">Contextual & RBAC Protected Assistant</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-orange-600" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'saffron-gradient text-white rounded-br-none shadow-xs'
                    : m.isError
                    ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-medium">{m.text}</div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-white">
                  U
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 p-3 rounded-xl border border-orange-200 w-fit font-medium">
              <Sparkles className="w-4 h-4 text-orange-600 animate-spin" />
              <span>Analyzing organization metrics & querying AI models...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask HR AI Copilot anything..."
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={loading || !query.trim()}
              className="absolute right-2 p-1.5 rounded-lg saffron-gradient text-white disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Powered by xAI Grok</span>
            <span className="flex items-center gap-1 text-orange-600 font-semibold">
              <Lock className="w-2.5 h-2.5" /> RBAC Enforced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
