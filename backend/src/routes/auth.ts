import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { normalizePhone } from "../lib/phone";
import { sendSms } from "../lib/sms";

const router = Router();
const googleClient = new OAuth2Client();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(30),
});

router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, username } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email or username already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, username },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "30d" });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "30d" });
  res.json({
    token,
    user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl },
  });
});

async function uniqueUsernameFrom(base: string) {
  const cleaned = base.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "chef";
  let candidate = cleaned;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${cleaned}${suffix}`;
  }
  return candidate;
}

interface SocialProfile {
  providerAccountId: string;
  email: string;
  avatarUrl?: string;
}

async function findOrCreateUserForAccount(provider: string, profile: SocialProfile) {
  const account = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId } },
    include: { user: true },
  });
  if (account) return account.user;

  const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  if (existingByEmail) {
    await prisma.account.create({
      data: { userId: existingByEmail.id, provider, providerAccountId: profile.providerAccountId },
    });
    if (!existingByEmail.avatarUrl && profile.avatarUrl) {
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: { avatarUrl: profile.avatarUrl },
      });
    }
    return existingByEmail;
  }

  const username = await uniqueUsernameFrom(profile.email.split("@")[0]);
  return prisma.user.create({
    data: {
      email: profile.email,
      username,
      avatarUrl: profile.avatarUrl,
      accounts: { create: { provider, providerAccountId: profile.providerAccountId } },
    },
  });
}

const googleSchema = z.object({ idToken: z.string().min(1) });

router.post("/google", authLimiter, async (req, res) => {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Invalid Google token" });
  }

  if (!payload?.sub || !payload.email) {
    return res.status(401).json({ error: "Invalid Google token" });
  }

  const user = await findOrCreateUserForAccount("google", {
    providerAccountId: payload.sub,
    email: payload.email,
    avatarUrl: payload.picture,
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "30d" });
  res.json({
    token,
    user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl },
  });
});

const phoneRequestSchema = z.object({ phone: z.string().min(1) });

router.post("/phone/request", authLimiter, async (req, res) => {
  const parsed = phoneRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return res.status(400).json({ error: "Утасны дугаар буруу байна" });
  }

  const last = await prisma.phoneOtp.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: "Түр хүлээгээд дахин оролдоно уу" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.phoneOtp.create({
    data: { phone, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  await sendSms(phone, `FF: Баталгаажуулах код ${code}. 5 минутын дотор хүчинтэй.`);
  res.json({ ok: true });
});

const phoneVerifySchema = z.object({ phone: z.string().min(1), code: z.string().min(1) });

router.post("/phone/verify", authLimiter, async (req, res) => {
  const parsed = phoneVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return res.status(400).json({ error: "Утасны дугаар буруу байна" });
  }

  const otp = await prisma.phoneOtp.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.expiresAt < new Date()) {
    return res.status(401).json({ error: "Код хугацаа дууссан байна" });
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: "Хэт олон удаа буруу оруулсан байна" });
  }
  if (otp.code !== parsed.data.code) {
    await prisma.phoneOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return res.status(401).json({ error: "Код буруу байна" });
  }

  await prisma.phoneOtp.deleteMany({ where: { phone } });

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    const username = await uniqueUsernameFrom(`chef${phone.slice(-4)}`);
    user = await prisma.user.create({ data: { phone, username } });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "30d" });
  res.json({
    token,
    user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl },
  });
});

export default router;
