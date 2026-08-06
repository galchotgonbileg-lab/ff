export const colors = {
  primary: "#8b5cf6",
  primaryDark: "#c4b5fd",
  primarySoft: "rgba(139,92,246,0.18)",
  accent: "#22d3ee",
  background: "#0b0c1f",
  surface: "#14162b",
  border: "rgba(255,255,255,0.09)",
  text: "#f1eefc",
  textMuted: "#9490b8",
  danger: "#ff6b81",
  dangerSoft: "rgba(255,107,129,0.16)",
  success: "#4ade80",
  overlay: "rgba(5,4,15,0.6)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
};

export const shadow = {
  card: {
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  floating: {
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

export const typography = {
  h1: { fontSize: 30, fontWeight: "800" as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: "800" as const, color: colors.text },
  h3: { fontSize: 17, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.text },
  muted: { fontSize: 13, fontWeight: "500" as const, color: colors.textMuted },
};

const AVATAR_PALETTE = ["#8b5cf6", "#22d3ee", "#f472b6", "#4ade80", "#fbbf24", "#60a5fa"];

export function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
