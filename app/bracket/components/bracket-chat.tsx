// app/bracket/components/bracket-chat.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai';
import { Button } from '@radix-ui/react-button';
import { Input } from '@radix-ui/react-input';
import { Textarea } from '@radix-ui/react-textarea';
import { Chat, Message } from 'recharts';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BracketChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const { data, error, isLoading } = useChat({
    api: async (messages) => {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
      });
      return response.choices[0].message;
    },
    messages: messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages((prev) => [...prev, { role: 'user', content: input }]);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4">
        <Chat>
          {messages.map((msg, index) => (
            <Message key={index} role={msg.role} content={msg.content} />
          ))}
          {data && <Message role="assistant" content={data.content} />}
        </Chat>
      </div>
      <form onSubmit={handleSubmit} className="flex items-center p-4 border-t border-gray-200">
        <Textarea
          value={input}
          onValueChange={setInput}
          placeholder="Type your question here..."
          className="flex-1 mr-4"
        />
        <Button type="submit" disabled={isLoading}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default BracketChat;