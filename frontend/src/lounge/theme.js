// Shared theme + config for the Digital Chai & Coffee Lounge

export const COLORS = {
  cream: "#FDFBF7",
  wood: "#D7B586",
  woodDark: "#B8935F",
  warmBrown: "#8B5A2B",
  espresso: "#3E2723",
  chaiOrange: "#E67E22",
  matcha: "#7CB342",
  boba: "#5D4037",
};

export const DRINKS = {
  chai: { key: "chai", label: "Chai", cup: "#C97B3A", liquid: "#B5651D", emoji: "☕", steam: true },
  espresso: { key: "espresso", label: "Espresso", cup: "#4E342E", liquid: "#2E1A15", emoji: "☕", steam: true },
  matcha: { key: "matcha", label: "Matcha", cup: "#9CCC65", liquid: "#7CB342", emoji: "🍵", steam: true },
  boba: { key: "boba", label: "Boba", cup: "#8D6E63", liquid: "#4E342E", emoji: "🧋", steam: false },
};

export const HEADS = [
  { key: "human", label: "Human" },
  { key: "cat", label: "Cat" },
  { key: "bear", label: "Bear" },
  { key: "bunny", label: "Bunny" },
];

export const HAIR_STYLES = [
  { key: "short", label: "Short" },
  { key: "long", label: "Long" },
  { key: "bun", label: "Top Bun" },
  { key: "bald", label: "Bald" },
];

export const HAIR_COLORS = ["#3E2723", "#6D4C41", "#A1887F", "#111111", "#E6A817", "#B85C38"];
export const OUTFIT_COLORS = ["#E67E22", "#7CB342", "#5C6BC0", "#EC407A", "#26A69A", "#8D6E63", "#EF5350", "#5D4037"];
export const SKIN_TONES = ["#F1C9A5", "#E0AC69", "#C68642", "#8D5524", "#FFDBAC"];
export const FUR_COLORS = ["#D7A86E", "#8D6E63", "#F5F0E6", "#B0BEC5", "#4E342E", "#E0A96D"];

export const REACTIONS = {
  drink: "😌",
  cheers: "🥂",
  steam: "♨️",
  wave: "👋",
};

export const NPC_LINES = [
  "This chai is *chef's kiss* 😌",
  "Rainy days + hot coffee = perfection",
  "Anyone want a refill? ☕",
  "Cheers everyone! 🥂",
  "The steam smells amazing today",
  "I could stay in this lounge forever",
  "Slow mornings are the best mornings",
  "Matcha gang, where you at? 🍵",
  "brb, grabbing a pastry 🥐",
  "So cozy in here today ~",
];

export function makeNPCs() {
  return [
    {
      id: "npc-mocha",
      name: "Mocha",
      drink: "espresso",
      isNPC: true,
      avatar: { head: "bear", hairStyle: "short", hairColor: "#3E2723", outfitColor: "#8D6E63", skinTone: "#F1C9A5", furColor: "#8D6E63" },
    },
    {
      id: "npc-luna",
      name: "Luna",
      drink: "matcha",
      isNPC: true,
      avatar: { head: "cat", hairStyle: "short", hairColor: "#111", outfitColor: "#7CB342", skinTone: "#E0AC69", furColor: "#B0BEC5" },
    },
    {
      id: "npc-pip",
      name: "Pip",
      drink: "boba",
      isNPC: true,
      avatar: { head: "bunny", hairStyle: "short", hairColor: "#A1887F", outfitColor: "#EC407A", skinTone: "#FFDBAC", furColor: "#F5F0E6" },
    },
  ];
}
