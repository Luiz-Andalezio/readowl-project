import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  // Validação básica
  if (!name || !email || !password) {
    const errors: { name?: string; email?: string; password?: string } = {};
    if (!name) errors.name = "Nome de usuário é obrigatório.";
    if (!email) errors.email = "Email é obrigatório.";
    if (!password) errors.password = "Senha é obrigatória.";
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  // Validação de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: { email: "Formato de email inválido." } }, { status: 400 });
  }

  // Validação de senha forte (mínimo 6 caracteres)
  if (password.length < 6) {
    return NextResponse.json({ error: { password: "A senha deve ter pelo menos 6 caracteres." } }, { status: 400 });
  }

  // Verifica se o email já existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: { email: "Já existe uma conta com este email." } }, { status: 400 });
  }

  const hashedPassword = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER",
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}