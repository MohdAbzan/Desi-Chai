import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users, Wifi, WifiOff } from "lucide-react";
import AvatarSetup from "./AvatarSetup";
import LoungeCanvas from "./LoungeCanvas";
import ChatPanel from "./ChatPanel";
import ControlBar from "./ControlBar";
import { useLounge } from "./useLounge";
import { makeNPCs, NPC_LINES, DRINKS } from "./theme";
import { unlockAudio, playAction, SFX, setAudioEnabled } from "./audio";

let msgCounter = 0;
const nextKey = () => `m${Date.now()}_${msgCounter++}`;

export default function Lounge() {
  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined" && window.location.search.includes("demo=1")) {
      return {
        name: "Bo",
        drink: "chai",
        avatar: { head: "human", hairStyle: "short", hairColor: "#3E2723", outfitColor: "#E67E22", skinTone: "#F1C9A5", furColor: "#D7A86E" },
      };
    }
    return null;
  });
  const [messages, setMessages] = useState([]);
  const [audioOn, setAudioOn] = useState(true);
  const canvasRef = useRef(null);
  const npcs = useMemo(() => makeNPCs(), []);
  const drinkByIdRef = useRef({});

  const rememberDrink = (id, drink) => {
    drinkByIdRef.current[id] = drink;
  };
  useEffect(() => {
    npcs.forEach((n) => rememberDrink(n.id, n.drink));
  }, [npcs]);

  const onChat = useCallback((msg) => {
    setMessages((prev) => [...prev.slice(-80), { ...msg, key: nextKey(), drink: drinkByIdRef.current[msg.id] }]);
    canvasRef.current?.triggerBubble(msg.id, msg.text);
    SFX.message();
  }, []);

  const onAction = useCallback((msg) => {
    canvasRef.current?.triggerAction(msg.id, msg.action);
    playAction(msg.action);
  }, []);

  const { connected, myId, roster, sendChat, sendAction } = useLounge(profile, { onChat, onAction });

  // track drinks of real users for chat labels
  useEffect(() => {
    roster.forEach((u) => rememberDrink(u.id, u.drink));
  }, [roster]);

  // Combined avatars: NPCs + real users, marking self
  const users = useMemo(() => {
    const real = roster.map((u) => ({ ...u, isMe: u.id === myId }));
    return [...npcs, ...real];
  }, [npcs, roster, myId]);

  // NPC ambient life
  useEffect(() => {
    if (!profile) return;
    const tick = () => {
      const n = npcs[Math.floor(Math.random() * npcs.length)];
      if (Math.random() < 0.55) {
        const line = NPC_LINES[Math.floor(Math.random() * NPC_LINES.length)];
        canvasRef.current?.triggerBubble(n.id, line);
        setMessages((prev) => [...prev.slice(-80), { id: n.id, name: n.name, text: line, key: nextKey(), drink: n.drink }]);
        SFX.message();
      } else {
        const acts = ["drink", "cheers", "steam", "wave"];
        const a = acts[Math.floor(Math.random() * acts.length)];
        canvasRef.current?.triggerAction(n.id, a);
        playAction(a);
      }
    };
    const iv = setInterval(tick, 4200 + Math.random() * 2500);
    const boot = setTimeout(() => canvasRef.current?.triggerAction(npcs[0].id, "drink"), 1200);
    return () => {
      clearInterval(iv);
      clearTimeout(boot);
    };
  }, [profile, npcs]);

  const handleJoin = (p) => {
    unlockAudio();
    SFX.join();
    setProfile(p);
  };

  const handleAction = (action) => {
    unlockAudio();
    if (myId) {
      sendAction(action);
    } else {
      // fallback before ws id assigned
      playAction(action);
    }
  };

  const handleSend = (text) => {
    unlockAudio();
    sendChat(text);
  };

  const toggleAudio = () => {
    const v = !audioOn;
    setAudioOn(v);
    setAudioEnabled(v);
    if (v) {
      unlockAudio();
      SFX.message();
    }
  };

  if (!profile) return <AvatarSetup onJoin={handleJoin} />;

  const liveCount = roster.length;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#D7B586]">
      <LoungeCanvas ref={canvasRef} users={users} />

      {/* top-left status */}
      <div
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-[#FDFBF7] border-2 border-[#3E2723] rounded-full shadow-[0_4px_0px_#3E2723]"
        data-testid="lounge-status"
      >
        {connected ? (
          <Wifi className="w-4 h-4 text-[#7CB342]" />
        ) : (
          <WifiOff className="w-4 h-4 text-[#EF5350]" />
        )}
        <span className="font-display font-semibold text-sm text-[#3E2723] flex items-center gap-1">
          <Users className="w-4 h-4" /> {liveCount} {liveCount === 1 ? "guest" : "guests"}
        </span>
      </div>

      <ChatPanel messages={messages} onSend={handleSend} myId={myId} />
      <ControlBar
        onAction={handleAction}
        drink={profile.drink}
        audioOn={audioOn}
        onToggleAudio={toggleAudio}
      />
    </div>
  );
}
