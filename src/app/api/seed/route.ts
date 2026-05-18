import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.NEXTAUTH_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const password = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@tiocarlos.com" },
    update: { password, active: true },
    create: {
      name: "Carlos (Admin)",
      email: "admin@tiocarlos.com",
      password,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "operador@tiocarlos.com" },
    update: { password, active: true },
    create: {
      name: "Operador General",
      email: "operador@tiocarlos.com",
      password,
      role: UserRole.CAJERO,
      active: true,
    },
  });

  return NextResponse.json({ ok: true, seeded: ["admin@tiocarlos.com", "operador@tiocarlos.com"] });
}
