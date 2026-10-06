import { z } from "zod"

/** POST /api/notifications/announcement */
export const announcementSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Write a short title")
      .max(120, "Keep the title under 120 characters"),
    message: z
      .string()
      .trim()
      .min(5, "Write the message")
      .max(1000, "Keep it under 1,000 characters"),
    audience: z.enum(["ALL", "FOUNDER_TEAM"]),
    founderVedId: z.string(),
  })
  .refine((v) => v.audience !== "FOUNDER_TEAM" || v.founderVedId !== "", {
    path: ["founderVedId"],
    message: "Choose a Founder",
  })
export type AnnouncementValues = z.infer<typeof announcementSchema>
