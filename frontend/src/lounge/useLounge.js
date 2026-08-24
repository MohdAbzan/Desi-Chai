import { useEffect, useRef, useState, useCallback } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
function wsUrl(room) {
  const base = BACKEND_URL.replace(/^http/, "ws");
  return `${base}/api/ws/${encodeURIComponent(room || "lounge")}`;
}

/**
 * Real-time lounge connection.
 * profile: {name, drink, avatar} | null  (connects once set)
 * handlers: {onChat(msg), onAction(msg)}
 */
export function useLounge(profile, handlers) {
  const [connected, setConnected] = useState(false);
  const [myId, setMyId] = useState(null);
  const [roster, setRoster] = useState([]);
  const wsRef = useRef(null);
  const handlersRef = useRef(handlers);
  const profileRef = useRef(profile);
  handlersRef.current = handlers;
  profileRef.current = profile;

  useEffect(() => {
    if (!profile) return;
    let closed = false;
    let retry = null;

    const connect = () => {
      const ws = new WebSocket(wsUrl(profileRef.current?.room));
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        const p = profileRef.current || {};
        ws.send(JSON.stringify({ type: "join", user: { name: p.name, drink: p.drink, avatar: p.avatar } }));
      };

      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (msg.type === "welcome") {
          setMyId(msg.id);
        } else if (msg.type === "roster") {
          setRoster(msg.users || []);
        } else if (msg.type === "chat") {
          handlersRef.current?.onChat?.(msg);
        } else if (msg.type === "action") {
          handlersRef.current?.onAction?.(msg);
        } else if (msg.type === "typing") {
          handlersRef.current?.onTyping?.(msg);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 1500);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const sendChat = useCallback((text) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "chat", text }));
    }
  }, []);

  const sendAction = useCallback((action) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "action", action }));
    }
  }, []);

  const sendTyping = useCallback((active) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "typing", active: !!active }));
    }
  }, []);

  const sendSeat = useCallback((seat) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "seat", seat }));
    }
  }, []);

  return { connected, myId, roster, sendChat, sendAction, sendTyping, sendSeat };
}
