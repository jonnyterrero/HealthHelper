"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type ChatMessage = { role: "user" | "assistant"; text: string; time?: string };

export interface ChatPanelProps {
  title?: string;
  description?: string;
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  actions?: React.ReactNode; // optional quick actions below input
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  title = "Chat Assistant",
  description = "Ask a question to get guidance",
  messages,
  input,
  setInput,
  onSend,
  actions,
}) => {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={listRef} className="max-h-60 overflow-auto rounded border p-2 text-sm space-y-2 bg-secondary/30">
          {messages.length === 0 ? (
            <p className="text-muted-foreground">Start the conversation above. I can reference your recent logs.</p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span className={m.role === "user" ? "inline-block rounded bg-primary text-primary-foreground px-2 py-1" : "inline-block rounded bg-secondary px-2 py-1"}>
                  {m.text}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) onSend();
            }}
          />
          <Button onClick={onSend}>Send</Button>
        </div>
        {actions ? <div className="pt-1">{actions}</div> : null}
      </CardContent>
    </Card>
  );
};