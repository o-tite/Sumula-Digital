// Gestão de contas de mesário (RF §1.5).

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/infrastructure/db";
import { NotFoundError, ValidationError } from "@/shared/errors";

const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

export async function listReferees() {
  return prisma.user.findMany({
    where: { role: "REFEREE" },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { name: "asc" }
  });
}

export async function createReferee(input: {
  name: string;
  email: string;
  password: string;
}) {
  if (!input.name?.trim()) throw new ValidationError("Nome é obrigatório");
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) {
    throw new ValidationError("Email inválido");
  }
  const pwd = passwordSchema.safeParse(input.password);
  if (!pwd.success) throw new ValidationError(pwd.error.issues[0]?.message ?? "Senha inválida");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ValidationError("Email já cadastrado");

  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: "REFEREE"
    }
  });
}

export async function updateRefereeName(id: string, name: string) {
  if (!name?.trim()) throw new ValidationError("Nome é obrigatório");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "REFEREE") throw new NotFoundError("Mesário não encontrado");
  return prisma.user.update({ where: { id }, data: { name: name.trim() } });
}

export async function resetRefereePassword(id: string, password: string) {
  const pwd = passwordSchema.safeParse(password);
  if (!pwd.success) throw new ValidationError(pwd.error.issues[0]?.message ?? "Senha inválida");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "REFEREE") throw new NotFoundError("Mesário não encontrado");
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.update({ where: { id }, data: { passwordHash } });
}
