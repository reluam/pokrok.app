"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, UserProfile, ToolId } from "@repo/types";
import { USER_PROFILE_KEY, TOOL_KEYS, CHAT_MESSAGES_KEY } from "@repo/types";
import { createClient } from "../lib/supabase/client";
import styles from "./ChatInterface.module.css";

const STARTER_PROMPTS = [
  "Chci se zamyslet nad tím, kam směřuju",
  "Mám pocit, že mi v životě něco chybí",
  "Potřebuji si ujasnit priority",
  "Nevím jak se rozhodnout v důležité věci",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = useRef(createClient());
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Load persisted messages + profile + tool data
  useEffect(() => {
    const rawMessages = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (rawMessages) {
      try { setMessages(JSON.parse(rawMessages)); } catch {}
    }
    const rawProfile = localStorage.getItem(USER_PROFILE_KEY);
    if (rawProfile) {
      try { setUserProfile(JSON.parse(rawProfile)); } catch {}
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [input]);

  function getToolContexts() {
    const toolIds: ToolId[] = ["decision-paralysis", "creative-block", "motivation"];
    const contexts = [];
    for (const toolId of toolIds) {
      const raw = localStorage.getItem(TOOL_KEYS[toolId]);
      if (raw) {
        try {
          contexts.push({ toolId, data: JSON.parse(raw) });
        } catch {}
      }
    }
    return contexts;
  }

  async function getUserId(): Promise<string | null> {
    if (userIdRef.current) return userIdRef.current;
    const { data: { user } } = await supabase.current.auth.getUser();
    userIdRef.current = user?.id ?? null;
    return userIdRef.current;
  }

  async function getOrCreateSession(): Promise<string | null> {
    if (sessionIdRef.current) return sessionIdRef.current;
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase.current
      .from("coaching_sessions")
      .insert({ user_id: userId, topic_id: "general" })
      .select("id")
      .single();
    if (error || !data) return null;
    sessionIdRef.current = data.id;
    return data.id;
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(newMessages));
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    const toolContexts = getToolContexts();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, userProfile, toolContexts }),
      });

      if (!res.ok || !res.body) throw new Error("Chyba při komunikaci s AI");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: fullText,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(finalMessages));
      setStreamingText("");

      // Save to DB (fire and forget)
      Promise.all([getOrCreateSession(), getUserId()]).then(([sid, userId]) => {
        if (sid && userId) {
          supabase.current.from("messages").insert([
            { session_id: sid, user_id: userId, role: "user", content: userMessage.content },
            { session_id: sid, user_id: userId, role: "assistant", content: fullText },
          ]);
        }
      });
    } catch (err) {
      console.error(err);
      setStreamingText("Omlouvám se, něco se pokazilo. Zkus to prosím znovu.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(CHAT_MESSAGES_KEY);
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.icon}>💬</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Povídej si</h1>
          <p className={styles.subtitle}>Osobní AI kouč — vždy tady pro tebe</p>
        </div>
        {messages.length > 0 && (
          <button className={styles.clearBtn} onClick={clearChat} title="Nový chat">
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 && !isLoading && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💬</span>
            <h2 className={styles.emptyTitle}>Jak se máš?</h2>
            <p className={styles.emptyHint}>
              Začni sdílet — o čemkoli. Jsem tady, abych naslouchal a pomohl ti najít vlastní odpovědi.
            </p>
            <div className={styles.emptyPrompts}>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className={styles.emptyPrompt}
                  onClick={() => setInput(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.message} ${msg.role === "user" ? styles.user : styles.assistant}`}
          >
            <div className={styles.bubble}>{msg.content}</div>
          </div>
        ))}

        {streamingText && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.bubble}>
              {streamingText}
              <span className={styles.cursor} />
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.bubble}>
              <span className={styles.dots}><span /><span /><span /></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napiš zprávu... (Enter pro odeslání, Shift+Enter pro nový řádek)"
          className={styles.textarea}
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className={styles.sendButton}
          aria-label="Odeslat"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
