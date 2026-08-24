import { useState } from "react";
import { Play, Pause, Radio } from "lucide-react";
import { getLofi } from "./lofi";

export default function LofiRadio() {
  const [playing, setPlaying] = useState(false);
  const [vol, setVol] = useState(0.35);
  const lofi = getLofi();

  const toggle = () => {
    if (playing) {
      lofi.stop();
      setPlaying(false);
    } else {
      lofi.setVolume(vol);
      lofi.start();
      setPlaying(true);
    }
  };

  const onVol = (e) => {
    const v = parseFloat(e.target.value);
    setVol(v);
    lofi.setVolume(v);
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-[#FDFBF7] border-2 border-[#3E2723] rounded-full shadow-[0_4px_0px_#3E2723]"
      data-testid="lofi-radio"
    >
      <button
        onClick={toggle}
        data-testid="lofi-toggle-btn"
        title={playing ? "Pause lofi" : "Play lofi"}
        className="clay-btn w-8 h-8 shrink-0 rounded-full bg-[#7CB342] border-2 border-[#3E2723] flex items-center justify-center text-white hover:scale-110"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <Radio className={`w-4 h-4 text-[#8B5A2B] ${playing ? "animate-pulse" : ""}`} />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={vol}
        onChange={onVol}
        data-testid="lofi-volume"
        aria-label="Lofi volume"
        className="w-20 sm:w-24 accent-[#E67E22] cursor-pointer"
      />
    </div>
  );
}
