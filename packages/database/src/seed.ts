import { PrismaClient } from "../generated/prisma/index.js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Grocery categories data
const categories = [
  { name: "Fruits & Vegetables", description: "Fresh fruits and vegetables" },
  { name: "Dairy & Eggs", description: "Milk, cheese, yogurt, and eggs" },
  { name: "Meat & Poultry", description: "Fresh meat and poultry" },
  { name: "Seafood", description: "Fresh fish and seafood" },
  { name: "Bakery", description: "Bread, pastries, and baked goods" },
  { name: "Pantry Essentials", description: "Rice, pasta, canned goods" },
  { name: "Beverages", description: "Drinks, juices, and water" },
  { name: "Snacks", description: "Chips, crackers, and snacks" },
];

// Store locations
const stores = [
  { name: "Jakarta Central Store" },
  { name: "Surabaya Main Branch" },
  { name: "Bandung Downtown" },
];

// Sample products for each category
const productsData = {
  "Fruits & Vegetables": [
    {
      name: "Fresh Bananas",
      slug: "fresh-bananas",
      description: "Sweet ripe bananas",
      basePrice: 15000,
    },
    {
      name: "Red Apples",
      slug: "red-apples",
      description: "Crispy red apples",
      basePrice: 25000,
    },
    {
      name: "Potato",
      slug: "potato",
      description: "Fresh potatoes",
      basePrice: 12000,
    },
  ],
  "Dairy & Eggs": [
    {
      name: "Fresh Milk 1L",
      slug: "fresh-milk-1l",
      description: "Fresh cow milk",
      basePrice: 18000,
    },
    {
      name: "Chicken Eggs (10pcs)",
      slug: "chicken-eggs-10pcs",
      description: "Fresh chicken eggs",
      basePrice: 25000,
    },
  ],
  "Meat & Poultry": [
    {
      name: "Chicken Breast",
      slug: "chicken-breast",
      description: "Boneless chicken breast",
      basePrice: 35000,
    },
  ],
  Seafood: [
    {
      name: "Fresh Salmon",
      slug: "fresh-salmon",
      description: "Atlantic salmon fillet",
      basePrice: 85000,
    },
  ],
  Bakery: [
    {
      name: "White Bread",
      slug: "white-bread",
      description: "Fresh white bread loaf",
      basePrice: 12000,
    },
  ],
  "Pantry Essentials": [
    {
      name: "Jasmine Rice 5kg",
      slug: "jasmine-rice-5kg",
      description: "Premium jasmine rice",
      basePrice: 65000,
    },
  ],
  Beverages: [
    {
      name: "Mineral Water 1.5L",
      slug: "mineral-water-1-5l",
      description: "Natural mineral water",
      basePrice: 5000,
    },
  ],
  Snacks: [
    {
      name: "Potato Chips",
      slug: "potato-chips",
      description: "Crispy potato chips",
      basePrice: 12000,
    },
  ],
};

async function cleanDatabase() {
  console.log("🧹 Cleaning existing data...");

  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.storeInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // Reset auto-increment/sequence for PostgreSQL
  // NOTE: Ganti nama sequence sesuai dengan nama tabel dan kolom id di schema.prisma
  // Jika pakai SQLite, bagian ini bisa di-skip
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "User_id_seq" RESTART WITH 1;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Store_id_seq" RESTART WITH 1;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Product_id_seq" RESTART WITH 1;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "ProductCategory_id_seq" RESTART WITH 1;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "StoreInventory_id_seq" RESTART WITH 1;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Cart_id_seq" RESTART WITH 1;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "CartItem_id_seq" RESTART WITH 1;`
  );

  console.log("✅ Database cleaned and sequences reset");
}

async function seedUsers() {
  console.log("👤 Seeding users...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const users = [];
  for (let i = 0; i < 10; i++) {
    const email = faker.internet.email().toLowerCase();
    const referralCode = faker.string.alphanumeric(8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isVerified: faker.datatype.boolean(),
        role: i === 0 ? "SUPER_ADMIN" : i <= 2 ? "STORE_ADMIN" : "USER",
        referralCode,
      },
    });

    users.push(user);
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function seedCategories() {
  console.log("📂 Seeding categories...");

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.productCategory.create({
      data: category,
    });
    createdCategories.push(created);
  }

  console.log(`✅ Created ${createdCategories.length} categories`);
  return createdCategories;
}

async function seedStores() {
  console.log("🏪 Seeding stores...");

  const createdStores = [];
  for (const store of stores) {
    const created = await prisma.store.create({
      data: store,
    });
    createdStores.push(created);
  }

  console.log(`✅ Created ${createdStores.length} stores`);
  return createdStores;
}

async function seedProducts(categories: any[]) {
  console.log("🛍️ Seeding products...");

  const createdProducts = [];

  for (const category of categories) {
    const categoryProducts =
      productsData[category.name as keyof typeof productsData] || [];

    for (const productData of categoryProducts) {
      const product = await prisma.product.create({
        data: {
          categoryId: category.id,
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.basePrice,
          isActive: true,
        },
      });

      createdProducts.push({ ...product, basePrice: productData.basePrice });
    }
  }

  console.log(`✅ Created ${createdProducts.length} products`);
  return createdProducts;
}

async function seedInventories(stores: any[], products: any[]) {
  console.log("📦 Seeding store inventories...");

  let inventoryCount = 0;

  for (const store of stores) {
    for (const product of products) {
      const priceVariation = faker.number.float({ min: 0.8, max: 1.2 });
      const price = Math.round(product.basePrice * priceVariation);
      const stockQty = faker.number.int({ min: 10, max: 500 });
      const reservedStock = faker.number.int({
        min: 0,
        max: Math.floor(stockQty * 0.1),
      });

      await prisma.storeInventory.create({
        data: {
          storeId: store.id,
          productId: product.id,
          stockQty,
          reservedStock,
          price,
        },
      });

      inventoryCount++;
    }
  }

  console.log(`✅ Created ${inventoryCount} inventory records`);
}
async function seedCarts(users: any[], products: any[], stores: any[]) {
  console.log("🛒 Seeding sample carts...");

  // Only create carts for USER role (following requirement)
  const regularUsers = users.filter((user) => user.role === "USER");
  const cartUsers = regularUsers.slice(0, 3);

  for (const user of cartUsers) {
    // Pilih store random untuk cart
    const store = faker.helpers.arrayElement(stores);

    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
        storeId: store.id, // WAJIB ADA SEKARANG
      },
    });

    const numItems = faker.number.int({ min: 2, max: 5 });
    const selectedProducts = faker.helpers.arrayElements(products, numItems);

    for (const product of selectedProducts) {
      const qty = faker.number.int({ min: 1, max: 5 });
      // Cari harga dari storeInventory yang sesuai
      const inventory = await prisma.storeInventory.findFirst({
        where: {
          storeId: store.id,
          productId: product.id,
        },
      });
      const unitPriceSnapshot = inventory ? inventory.price : product.basePrice;

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          qty,
          unitPriceSnapshot,
        },
      });
    }
  }

  console.log(`✅ Created ${cartUsers.length} sample carts (USER role only)`);
}

async function seed() {
  try {
    console.log("🌱 Starting database seeding...\n");

    await cleanDatabase();

    const users = await seedUsers();
    const categories = await seedCategories();
    const stores = await seedStores();
    const products = await seedProducts(categories);

    await seedInventories(stores, products);
    await seedCarts(users, products, stores);

    const regularUsers = users.filter((user) => user.role === "USER");

    console.log("\n� Database seeding completed successfully!");
    console.log(`
📊 Summary:
- ${users.length} users created
- ${categories.length} categories created
- ${stores.length} stores created
- ${products.length} products created
- ${stores.length * products.length} inventory records created
- 3 sample carts created (USER role only)

🔑 Login credentials:
Email: any seeded email
Password: password123

👥 User Roles (following requirement):
- USER ID 1: SUPER_ADMIN (no cart - admin role)
- USER ID 2-3: STORE_ADMIN (no cart - admin role)  
- USER ID 4-10: USER (have carts - customers)
    `);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
