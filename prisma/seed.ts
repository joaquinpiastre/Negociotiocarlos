import { PrismaClient, UserRole, UnitType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@tiocarlos.com" },
    update: {},
    create: {
      name: "Carlos (Admin)",
      email: "admin@tiocarlos.com",
      password,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "operador@tiocarlos.com" },
    update: {},
    create: {
      name: "Operador General",
      email: "operador@tiocarlos.com",
      password,
      role: UserRole.CAJERO,
    },
  });

  const categories = [
    "Almacen",
    "Bebidas",
    "Limpieza",
    "Lacteos",
    "Carniceria",
    "Verduleria",
    "Panaderia",
    "Congelados",
    "Kiosco",
    "Perfumeria",
    "Otros",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const supplier = await prisma.supplier.upsert({
    where: { id: "supplier-default" },
    update: {},
    create: {
      id: "supplier-default",
      name: "Distribuidora Neuquen SRL",
      phone: "+54 299 555-0110",
      email: "ventas@distribuidora-neuquen.com",
      address: "Ruta 40 Km 25, Chos Malal",
      cuit: "30-71234567-8",
    },
  });

  const bebidas = await prisma.category.findUniqueOrThrow({
    where: { name: "Bebidas" },
  });

  await prisma.product.upsert({
    where: { barcode: "7791234567890" },
    update: {},
    create: {
      barcode: "7791234567890",
      name: "Gaseosa Cola 2.25L",
      brand: "Marca Sur",
      costPrice: 1300,
      salePrice: 1950,
      stock: 24,
      minStock: 6,
      unitType: UnitType.UNIDAD,
      categoryId: bebidas.id,
      supplierId: supplier.id,
    },
  });

  await prisma.businessSettings.upsert({
    where: { id: "business-default" },
    update: {},
    create: {
      id: "business-default",
      businessName: "Tio Carlos",
      location: "Chos Malal",
      phone: "+54 2948 123456",
      currency: "ARS",
      suggestedProfitPercent: 30,
      globalMinStock: 3,
      receiptHeader: "Gracias por tu compra en Tio Carlos",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
