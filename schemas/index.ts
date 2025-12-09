import { z } from "zod";
import { Role, EnrollmentStatus, AttendanceMethod } from "@/app/prisma/enums";

export const UserSchema = z.object({
  itsNumber: z.string().regex(/^\d{8}$/, "ITS Number must be exactly 8 digits"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional()
    .or(z.literal("")),
  role: z.nativeEnum(Role).optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
});

export const LocationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().positive().default(100),
});

export const SabaqSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    kitaab: z.string().min(2, "Kitaab name is required"),
    level: z.string().min(1, "Level is required"),
    description: z.string().optional(),
    criteria: z.string().min(1, "Criteria is required"),
    enrollmentStartsAt: z.coerce.date(),
    enrollmentEndsAt: z.coerce.date(),
    allowLocationAttendance: z.boolean().default(false),
    locationId: z.string().optional(),
    janabId: z.string().optional(),
    whatsappGroupLink: z.string().optional(),
  })
  .refine((data) => data.enrollmentEndsAt > data.enrollmentStartsAt, {
    message: "Enrollment end date must be after start date",
    path: ["enrollmentEndsAt"],
  });

export const SessionSchema = z
  .object({
    sabaqId: z.string(),
    scheduledAt: z.coerce.date(),
    cutoffTime: z.coerce.date(),
  })
  .refine((data) => data.cutoffTime > data.scheduledAt, {
    message: "Cutoff time must be after scheduled time",
    path: ["cutoffTime"],
  });

export const AttendanceSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  itsNumber: z.string().regex(/^\d{8}$/),
  method: z.nativeEnum(AttendanceMethod),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const EnrollmentSchema = z.object({
  sabaqId: z.string(),
  userId: z.string(),
});

export const QuestionSchema = z.object({
  sessionId: z.string(),
  question: z
    .string()
    .min(1, "Question cannot be empty")
    .max(500, "Question must be 500 characters or less"),
});

export const AnswerSchema = z.object({
  answer: z.string().min(1, "Answer cannot be empty"),
});
