import { z } from "zod";
import { traits, motives } from "./model";
const stats = z
  .object({
    saved: z.number().finite().optional(),
    harm: z.number().finite().optional(),
    civilization: z.number().finite().optional(),
    trust: z.number().finite().optional(),
    materials: z.number().finite().optional(),
    damage: z.number().finite().optional(),
    energy: z.number().finite().optional(),
  })
  .strict();
export const eventSchema = z.object({
  id: z.string().min(1),
  arc: z.string().min(1),
  stage: z.number().int().min(0).max(3),
  title: z.string().min(1),
  text: z.string().min(1),
  region: z.string().min(1),
  scene: z.enum([
    "wasteland",
    "village",
    "city",
    "lab",
    "data",
    "forest",
    "snow",
    "rebuilt",
  ]),
  weight: z.number().positive().finite(),
  requires: z.string().optional(),
  gate: z
    .object({
      anyMemory: z.array(z.string()).min(1).optional(),
      minTrust: z.number().finite().min(0).optional(),
      minCivilization: z.number().finite().min(0).optional(),
      minTrait: z
        .object({ trait: z.enum(traits), value: z.number().min(0).max(95) })
        .optional(),
    })
    .optional(),
  critical: z.boolean(),
  years: z.number().positive().finite(),
  next: z.array(z.string()),
  actions: z
    .array(
      z.object({
        label: z.string().min(1),
        result: z.string().min(1),
        motive: z.enum(motives),
        traits: z.partialRecord(z.enum(traits), z.number().min(-10).max(10)),
        effects: stats,
        memory: z.string().min(1),
        requires: z.string().optional(),
        life: z.number().min(-3).max(3).optional(),
      }),
    )
    .min(2),
});
