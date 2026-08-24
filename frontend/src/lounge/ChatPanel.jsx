import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { DRINKS } from "./theme";

export default function ChatPanel({ messages, onSend, myId, onTyping }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const typingStopRef = useRef(null);
  const lastTypeRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChange = (e) => {
    const v = e.target.value;
    setText(v);
    if (!onTyping) return;
    if (v.trim()) {
      const now = Date.now();
      if (now - lastTypeRef.current > 1500) {
        onTyping(true);
        lastTypeRef.current = now;
      }
      clearTimeout(typingStopRef.current);
      typingStopRef.current = setTimeout(() => {
        onTyping(false);
        lastTypeRef.current = 0;
      }, 2200);
    } else {
      clearTimeout(typingStopRef.current);
      onTyping(false);
      lastTypeRef.current = 0;
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    onSend(v);
    setText("");
    clearTimeout(typingStopRef.current);
    onTyping?.(false);
    lastTypeRef.current = 0;
  };

  return (
    <div
      className="absolute top-0 right-0 h-full w-[86vw] max-w-[340px] z-10 flex flex-col p-3 sm:p-4 bg-[#FDFBF7]/85 backdrop-blur-xl border-l-4 border-[#3E2723]"
      data-testid="chat-panel"
    >
      <div className="flex items-center gap-2 mb-3 px-2">
        <div className="w-9 h-9 rounded-xl bg-[#E67E22] border-2 border-[#3E2723] flex items-center justify-center shadow-[2px_2px_0px_#3E2723]">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-display text-xl text-[#3E2723] font-semibold">Lounge Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll pr-1 space-y-2.5" data-testid="chat-messages">
        {messages.length === 0 && (
          <p className="text-sm text-[#5D4037]/70 px-2 mt-4">
            Say hi to the lounge ☕ Try the buttons below to react!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.id === myId;
          const d = DRINKS[m.drink];
          return (
            <div key={m.key} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="text-[11px] font-bold text-[#8B5A2B] px-2 font-display">
                {mine ? "You" : m.name} {d ? d.emoji : ""}
              </span>
              <div
                className={`max-w-[85%] px-3 py-2 text-sm border-2 border-[#3E2723] shadow-[2px_2px_0px_#3E2723] bubble-in ${
                  mine
                    ? "bg-[#E67E22] text-white rounded-2xl rounded-br-none"
                    : "bg-white text-[#3E2723] rounded-2xl rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2" data-testid="chat-form">
        <input
          value={text}
          onChange={handleChange}
          maxLength={280}
          placeholder="Type a message…"
          data-testid="chat-input"
          className="flex-1 px-4 py-3 rounded-full bg-white border-2 border-[#3E2723] text-[#3E2723] placeholder:text-[#8B5A2B]/60 outline-none focus:ring-4 focus:ring-[#E67E22]/40 text-sm font-semibold"
        />
        <button
          type="submit"
          data-testid="chat-send-btn"
          className="clay-btn w-12 h-12 shrink-0 rounded-full bg-[#E67E22] border-2 border-[#3E2723] shadow-[0_4px_0px_#3E2723] flex items-center justify-center text-white hover:scale-105"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
