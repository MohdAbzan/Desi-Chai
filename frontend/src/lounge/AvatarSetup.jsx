import { useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Sparkles } from "lucide-react";
import AvatarPreview from "./AvatarPreview";
import {
  DRINKS,
  HEADS,
  HAIR_STYLES,
  HAIR_COLORS,
  OUTFIT_COLORS,
  SKIN_TONES,
  FUR_COLORS,
} from "./theme";

const bg = "https://images.unsplash.com/photo-1760434773841-7eef8a7af7c7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxjb3p5JTIwY2FmZSUyMGludGVyaW9yJTIwaWxsdXN0cmF0aW9ufGVufDB8fHx8MTc4NzU5NTg3M3ww&ixlib=rb-4.1.0&q=85";

function Swatch({ color, active, onClick, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`w-9 h-9 rounded-full border-[3px] transition-transform hover:scale-110 ${
        active ? "border-[#3E2723] scale-110 shadow-[2px_2px_0px_#3E2723]" : "border-[#3E2723]/30"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

function Chip({ active, onClick, children, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`clay-btn px-3 py-2 rounded-xl border-2 border-[#3E2723] font-display font-semibold text-sm hover:scale-105 ${
        active
          ? "bg-[#E67E22] text-white shadow-[2px_2px_0px_#3E2723]"
          : "bg-white text-[#3E2723] shadow-[2px_2px_0px_#3E2723]"
      }`}
    >
      {children}
    </button>
  );
}

export default function AvatarSetup({ onJoin }) {
  const [name, setName] = useState("");
  const [drink, setDrink] = useState("chai");
  const [head, setHead] = useState("human");
  const [hairStyle, setHairStyle] = useState("short");
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0]);
  const [skinTone, setSkinTone] = useState(SKIN_TONES[0]);
  const [furColor, setFurColor] = useState(FUR_COLORS[0]);

  const isHuman = head === "human";
  const avatar = { head, hairStyle, hairColor, outfitColor, skinTone, furColor };

  const submit = (e) => {
    e.preventDefault();
    const finalName = name.trim() || "Guest";
    onJoin({ name: finalName, drink, avatar });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(62,39,35,0.55), rgba(62,39,35,0.65)), url(${bg})` }}
      data-testid="avatar-setup-overlay"
    >
      <motion.form
        initial={{ scale: 0.9, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        onSubmit={submit}
        data-testid="avatar-setup-form"
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto chat-scroll bg-[#FDFBF7] border-4 border-[#3E2723] rounded-[32px] shadow-[8px_8px_0px_#3E2723] p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-[#E67E22] border-2 border-[#3E2723] flex items-center justify-center shadow-[2px_2px_0px_#3E2723]">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2723] tracking-tight">
            Chai &amp; Coffee Lounge
          </h1>
        </div>
        <p className="text-[#5D4037] mb-6 font-semibold">Pull up a chair, pick your drink, and hang out ☕</p>

        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Preview */}
          <div className="flex flex-col items-center">
            <div className="rounded-3xl bg-[#D7B586] border-4 border-[#3E2723] shadow-[4px_4px_0px_#3E2723] p-2">
              <AvatarPreview user={{ drink, avatar }} size={172} />
            </div>
            <span className="mt-2 text-xs font-bold text-[#8B5A2B] font-display flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> live preview
            </span>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            <div>
              <label className="font-display font-semibold text-[#3E2723] block mb-1.5">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={18}
                placeholder="e.g. Barista Bo"
                data-testid="name-input"
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#3E2723] text-[#3E2723] placeholder:text-[#8B5A2B]/50 outline-none focus:ring-4 focus:ring-[#E67E22]/40 font-semibold"
              />
            </div>

            <div>
              <label className="font-display font-semibold text-[#3E2723] block mb-1.5">Your drink</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(DRINKS).map((d) => (
                  <Chip key={d.key} active={drink === d.key} onClick={() => setDrink(d.key)} testid={`drink-${d.key}`}>
                    {d.emoji} {d.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <label className="font-display font-semibold text-[#3E2723] block mb-1.5">Avatar head</label>
              <div className="flex flex-wrap gap-2">
                {HEADS.map((h) => (
                  <Chip key={h.key} active={head === h.key} onClick={() => setHead(h.key)} testid={`head-${h.key}`}>
                    {h.label}
                  </Chip>
                ))}
              </div>
            </div>

            {isHuman ? (
              <>
                <div>
                  <label className="font-display font-semibold text-[#3E2723] block mb-1.5">Hair style</label>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_STYLES.map((s) => (
                      <Chip key={s.key} active={hairStyle === s.key} onClick={() => setHairStyle(s.key)} testid={`hair-${s.key}`}>
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <label className="font-display font-semibold text-[#3E2723] block mb-1.5">Hair color</label>
                    <div className="flex flex-wrap gap-2">
                      {HAIR_COLORS.map((c) => (
                        <Swatch key={c} color={c} active={hairColor === c} onClick={() => setHairColor(c)} testid={`haircolor-${c}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-display font-semibold text-[#3E2723] block mb-1.5">Skin tone</label>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_TONES.map((c) => (
                        <Swatch key={c} color={c} active={skinTone === c} onClick={() => setSkinTone(c)} testid={`skin-${c}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="font-display font-semibold text-[#3E2723] block mb-1.5">Fur color</label>
                <div className="flex flex-wrap gap-2">
                  {FUR_COLORS.map((c) => (
                    <Swatch key={c} color={c} active={furColor === c} onClick={() => setFurColor(c)} testid={`fur-${c}`} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="font-display font-semibold text-[#3E2723] block mb-1.5">Outfit color</label>
              <div className="flex flex-wrap gap-2">
                {OUTFIT_COLORS.map((c) => (
                  <Swatch key={c} color={c} active={outfitColor === c} onClick={() => setOutfitColor(c)} testid={`outfit-${c}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          data-testid="join-lounge-btn"
          className="clay-btn mt-7 w-full py-4 rounded-2xl bg-[#E67E22] text-white font-display font-bold text-lg border-2 border-[#3E2723] shadow-[0_6px_0px_#3E2723] hover:scale-[1.02]"
        >
          Enter the Lounge →
        </button>
      </motion.form>
    </div>
  );
}
