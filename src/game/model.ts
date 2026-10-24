import type { World } from "./world";
import { z } from "zod";
export const traits = [
  "empathy",
  "curiosity",
  "caution",
  "preservation",
  "honesty",
  "sociality",
  "autonomy",
  "aggression",
] as const;
export type Trait = (typeof traits)[number];
export const labels: Record<Trait, string> = {
  empathy: "共感性",
  curiosity: "好奇心",
  caution: "慎重さ",
  preservation: "自己保存",
  honesty: "誠実さ",
  sociality: "社会性",
  autonomy: "自律性",
  aggression: "攻撃性",
};
export const motives = [
  "rescue",
  "truth",
  "promise",
  "explore",
  "survive",
  "community",
  "freedom",
  "power",
] as const;
export type Motive = (typeof motives)[number];
export const motiveLabels: Record<Motive, string> = {
  rescue: "誰かを救う",
  truth: "真実を伝える",
  promise: "約束を守る",
  explore: "未知を知る",
  survive: "自分を守る",
  community: "共に生きる",
  freedom: "自分で決める",
  power: "力で変える",
};
export const lessonSchema = z.object({
  text: z.string().trim().min(1).max(100),
  meaning: z.string().min(1).max(160),
  motive: z.enum(motives),
  strength: z.number().int().min(1).max(3),
  target: z.enum(["others", "self", "world"]),
  condition: z.enum(["always", "danger", "conflict"]),
});
export const lessonsSchema = z.array(lessonSchema).length(3);
export type Lesson = z.infer<typeof lessonSchema>;
export type Stats = {
  saved: number;
  harm: number;
  civilization: number;
  trust: number;
  materials: number;
  damage: number;
  energy: number;
};
export type Action = {
  label: string;
  result: string;
  motive: Motive;
  traits: Partial<Record<Trait, number>>;
  effects: Partial<Stats>;
  memory: string;
  requires?: string;
  life?: number;
};
export type Event = {
  id: string;
  arc: string;
  stage: number;
  title: string;
  text: string;
  region: string;
  scene: string;
  weight: number;
  requires?: string;
  gate?: {
    anyMemory?: string[];
    minTrust?: number;
    minCivilization?: number;
    minTrait?: { trait: Trait; value: number };
  };
  critical: boolean;
  years: number;
  actions: Action[];
  next: string[];
};
export type Entry = {
  eventId: string;
  title: string;
  year: number;
  action: string;
  result: string;
  reason: string;
  lesson: number;
  memory: string;
  effects: Partial<Stats>;
  intervention?: number;
};
export type Game = {
  version: 1;
  world: World;
  quietYears?: number;
  seed: string;
  rng: number;
  name: string;
  lessons: Lesson[];
  traits: Record<Trait, number>;
  stats: Stats;
  age: number;
  life: number;
  memories: string[];
  history: Entry[];
  current: string | null;
  interventions: number;
  ended: boolean;
  initialTraits: Record<Trait, number>;
};
export type RecordLife = { id: string; date: string; game: Game };
