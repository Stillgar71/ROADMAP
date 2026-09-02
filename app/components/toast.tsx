"use client";

import { useEffect } from "react";

export type ToastMessage = {
  id: number;
  text: string;
  type: "success" | "error";
};

export function Toasts({ messages, onDismiss }: { messages: ToastMessage[]; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timers = messages.map((message) => window.setTimeout(() => onDismiss(message.id), message.type === "error" ? 7000 : 4000));
    return () => timers.forEach(window.clearTimeout);
  }, [messages, onDismiss]);

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2" aria-live="polite">
      {messages.map((message) => (
        <div key={message.id} role="status" className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => onDismiss(message.id)} aria-label="Dismiss notification" className="-mr-1 -mt-1 rounded px-1 text-lg leading-none hover:bg-black/5">x</button>
        </div>
      ))}
    </div>
  );
}