import { Coffee, PartyPopper, Wind, Hand, Volume2, VolumeX } from "lucide-react";
import { DRINKS } from "./theme";

const ACTIONS = [
  { key: "drink", label: "Drink", icon: Coffee, color: "#E67E22" },
  { key: "cheers", label: "Cheers!", icon: PartyPopper, color: "#7CB342" },
  { key: "steam", label: "Blow Steam", icon: Wind, color: "#5C6BC0" },
  { key: "wave", label: "Wave", icon: Hand, color: "#EC407A" },
];

export default function ControlBar({ onAction, drink, audioOn, onToggleAudio }) {
  const d = DRINKS[drink] || DRINKS.chai;
  return (
    <div
      className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-[#FDFBF7] border-4 border-[#3E2723] rounded-full shadow-[0_8px_0px_#3E2723] max-w-[94vw]"
      data-testid="control-bar"
    >
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        const label = a.key === "drink" ? `Drink ${d.label}` : a.label;
        return (
          <button
            key={a.key}
            onClick={() => onAction(a.key)}
            data-testid={`action-${a.key}-btn`}
            title={label}
            className="clay-btn group flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full border-2 border-[#3E2723] text-white font-display font-semibold text-sm shadow-[0_4px_0px_#3E2723] hover:scale-105"
            style={{ backgroundColor: a.color }}
          >
            <Icon className="w-5 h-5" />
            <span className="hidden md:inline">{label}</span>
          </button>
        );
      })}

      <div className="w-px h-8 bg-[#3E2723]/25 mx-1" />

      <button
        onClick={onToggleAudio}
        data-testid="audio-toggle-btn"
        title={audioOn ? "Mute" : "Unmute"}
        className="clay-btn w-11 h-11 shrink-0 rounded-full bg-[#3E2723] border-2 border-[#3E2723] shadow-[0_4px_0px_#8B5A2B] flex items-center justify-center text-[#FDFBF7] hover:scale-105"
      >
        {audioOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
    </div>
  );
}
