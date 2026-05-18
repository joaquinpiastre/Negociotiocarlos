import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const settings = await prisma.businessSettings.findFirst();
  return Response.json(settings);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { businessName, location, phone, currency, suggestedProfitPercent, globalMinStock, receiptHeader } = body;

  const existing = await prisma.businessSettings.findFirst();

  const settings = existing
    ? await prisma.businessSettings.update({
        where: { id: existing.id },
        data: { businessName, location, phone, currency, suggestedProfitPercent, globalMinStock, receiptHeader },
      })
    : await prisma.businessSettings.create({
        data: {
          id: "business-default",
          businessName,
          location,
          phone,
          currency,
          suggestedProfitPercent,
          globalMinStock,
          receiptHeader,
        },
      });

  return Response.json(settings);
}
