export type TrackCategoryType = "aplicacao" | "modulo";

export type TrackCategoryIcon =
  | "chart"
  | "users"
  | "flask"
  | "clipboard"
  | "file-text"
  | "wallet"
  | "building"
  | "headset"
  | "credit-card"
  | "factory";

export type TrackCategoryAccent =
  | "teal"
  | "navy"
  | "orange"
  | "green"
  | "red"
  | "violet"
  | "tertiary"
  | "info"
  | "neutral";

export type TrackCategory = {
  id: string;
  type: TrackCategoryType;
  name: string;
  tagline: string;
  iconKey: TrackCategoryIcon;
  accent: TrackCategoryAccent;
  trackCount: number;
  lessonCount: number;
  inProgress: number;
  completed: number;
  progressPct: number;
  href: string;
};
