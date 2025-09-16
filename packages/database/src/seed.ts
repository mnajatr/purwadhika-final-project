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

// Store definitions - seed Bandung and Jakarta stores so admin assignment
// and order routing can be tested across multiple stores.
const stores = [
  { name: "Store Bandung", isActive: true },
  { name: "Store Jakarta", isActive: true },
];

// Sample products for each category
const productsData = {
  "Fruits & Vegetables": [
    {
      name: "Fresh Bananas",
      slug: "fresh-bananas",
      description: "Sweet ripe bananas",
      basePrice: 15000,
      imageUrl:
        "https://plus.unsplash.com/premium_photo-1724250081106-4bb1be9bf950?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGJhbmFuYXxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      name: "Red Apples",
      slug: "red-apples",
      description: "Crispy red apples",
      basePrice: 25000,
      imageUrl:
        "https://plus.unsplash.com/premium_photo-1724249989963-9286e126af81?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YXBwbGV8ZW58MHx8MHx8fDA%3D",
    },
    {
      name: "Potato",
      slug: "potato",
      description: "Fresh potatoes",
      basePrice: 12000,
      imageUrl:
        "https://plus.unsplash.com/premium_photo-1675365779531-031dfdcdf947?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cG90YXRvfGVufDB8MHwwfHx8MA%3D%3D",
    },
  ],
  "Dairy & Eggs": [
    {
      name: "Fresh Milk 1L",
      slug: "fresh-milk-1l",
      description: "Fresh cow milk",
      basePrice: 18000,
      imageUrl:
        "https://images.unsplash.com/photo-1588710929895-6ee7a0a4d155?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bWlsa3xlbnwwfDB8MHx8fDA%3D",
    },
    {
      name: "Chicken Eggs (10pcs)",
      slug: "chicken-eggs-10pcs",
      description: "Fresh chicken eggs",
      basePrice: 25000,
      imageUrl:
        "https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZWdnfGVufDB8MHwwfHx8MA%3D%3D",
    },
  ],
  "Meat & Poultry": [
    {
      name: "Chicken Breast",
      slug: "chicken-breast",
      description: "Boneless chicken breast",
      basePrice: 35000,
      imageUrl:
        "https://images.unsplash.com/photo-1642497394469-188b0f4bcae6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y2hpY2tlbiUyMG1lYXR8ZW58MHwwfDB8fHww",
    },
  ],
  Seafood: [
    {
      name: "Fresh Salmon",
      slug: "fresh-salmon",
      description: "Atlantic salmon fillet",
      basePrice: 85000,
      imageUrl:
        "https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2FsbW9ufGVufDB8MHwwfHx8MA%3D%3D",
    },
  ],
  Bakery: [
    {
      name: "White Bread",
      slug: "white-bread",
      description: "Fresh white bread loaf",
      basePrice: 12000,
      imageUrl:
        "https://images.unsplash.com/photo-1592029780368-c1fff15bcfd5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2hpdGUlMjBicmVhZHxlbnwwfDB8MHx8fDA%3D",
    },
  ],
  "Pantry Essentials": [
    {
      name: "Jasmine Rice 5kg",
      slug: "jasmine-rice-5kg",
      description: "Premium jasmine rice",
      basePrice: 65000,
      imageUrl:
        "https://images.unsplash.com/photo-1686820740687-426a7b9b2043?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cmljZXxlbnwwfDB8MHx8fDA%3D",
    },
  ],
  Beverages: [
    {
      name: "Mineral Water 1.5L",
      slug: "mineral-water-1-5l",
      description: "Natural mineral water",
      basePrice: 5000,
      imageUrl:
        "https://images.unsplash.com/photo-1612134678926-7592c521aa52?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWluZXJhbCUyMHdhdGVyfGVufDB8MHwwfHx8MA%3D%3D",
    },
  ],
  Snacks: [
    {
      name: "Potato Chips",
      slug: "potato-chips",
      description: "Crispy potato chips",
      basePrice: 12000,
      imageUrl:
        "https://images.unsplash.com/photo-1576642589592-7d9778a1c9e4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y2hpcHN8ZW58MHwwfDB8fHww",
    },
  ],
};

async function cleanDatabase() {
  console.log("🧹 Cleaning existing data...");

  // Delete dependent tables first to avoid foreign key constraint errors
  await prisma.orderItem.deleteMany();
  // Payments and shipments reference orders, delete them before deleting orders
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  // StockJournal references storeInventory via composite FK; delete journals first
  await prisma.productImage.deleteMany();
  await prisma.stockJournal.deleteMany();
  await prisma.storeInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  // Delete store locations first to avoid FK constraint errors
  await prisma.storeLocation.deleteMany();
  // Delete store admin assignments before deleting stores to avoid FK constraint
  await prisma.storeAdminAssignment.deleteMany();
  await prisma.store.deleteMany();
  await prisma.userAddress.deleteMany();
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

  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Order_id_seq" RESTART WITH 1;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "OrderItem_id_seq" RESTART WITH 1;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "UserAddress_id_seq" RESTART WITH 1;`
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
        password: passwordHash,
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

  // Create explicit StoreLocation rows for Bandung and Jakarta
  // Bandung location (lat: -6.9175, lon: 107.6191)
  const bandung = createdStores.find((s) =>
    s.name.toLowerCase().includes("bandung")
  );
  if (bandung) {
    await prisma.storeLocation.create({
      data: {
        storeId: bandung.id,
        addressLine: "Jl. Merdeka No.1",
        province: "Jawa Barat",
        city: "Bandung",
        district: "Sumur Bandung",
        postalCode: "40111",
        latitude: -6.9175,
        longitude: 107.6191,
      },
    });
  }

  // No Jakarta store seeded for radius-negative test case

  // Jakarta location (lat: -6.2000, lon: 106.8166)
  const jakarta = createdStores.find((s) => s.name.toLowerCase().includes("jakarta"));
  if (jakarta) {
    await prisma.storeLocation.create({
      data: {
        storeId: jakarta.id,
        addressLine: "Jl. Sudirman No.1",
        province: "DKI Jakarta",
        city: "Jakarta",
        district: "Tanah Abang",
        postalCode: "10210",
        latitude: -6.2000,
        longitude: 106.8166,
      },
    });
  }

  console.log(`✅ Created ${createdStores.length} stores`);
  return createdStores;
}

async function seedStoreAssignments(users: any[], stores: any[]) {
  console.log("🔐 Seeding store admin assignments...");

  const storeAdmins = users.filter((u) => u.role === "STORE_ADMIN");
  if (storeAdmins.length === 0 || stores.length === 0) {
    console.log("No store admins or stores found — skipping assignments");
    return [];
  }

  const assignments = [];
  // Round-robin assign store admins to stores (or assign first store if single)
  for (let i = 0; i < storeAdmins.length; i++) {
    const admin = storeAdmins[i];
    const store = stores[i % stores.length];
    const a = await prisma.storeAdminAssignment.create({
      data: { storeId: store.id, userId: admin.id },
    });
    assignments.push(a);
  }

  console.log(`✅ Created ${assignments.length} store assignments`);
  return assignments;
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
          weight: 0,
          width: 0,
          height: 0,
          length: 0,
          isActive: true,
          images: {
            create: [
              {
                imageUrl: productData.imageUrl,
              },
            ],
          },
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
        },
      });

      inventoryCount++;
    }
  }

  console.log(`✅ Created ${inventoryCount} inventory records`);
}

async function seedShippingMethods() {
  console.log("🚚 Seeding shipping methods...");

  const shippingMethods = [
    {
      carrier: "JNE",
      serviceCode: "REG",
      isActive: true,
    },
    {
      carrier: "JNE",
      serviceCode: "OKE", 
      isActive: true,
    },
    {
      carrier: "TIKI",
      serviceCode: "REG",
      isActive: true,
    },
  ];

  const createdMethods = [];
  for (const method of shippingMethods) {
    const created = await prisma.shippingMethod.create({
      data: method,
    });
    createdMethods.push(created);
  }

  console.log(`✅ Created ${createdMethods.length} shipping methods`);
  return createdMethods;
}
async function seedOrders(users: any[], stores: any[], products: any[]) {
  console.log("📦 Seeding sample orders for Feature 3 testing...");

  // Use a test user that has addresses (seedUserAddresses targets id=4)
  const testUser = users.find((u) => u.id === 4) ?? users[0];
  if (!testUser) {
    console.log("No users available — skipping orders");
    return [];
  }

  const store = stores[0];
  if (!store) {
    console.log("No stores available — skipping orders");
    return [];
  }

  // Ensure the test user has an address
  const address = await prisma.userAddress.findFirst({ where: { userId: testUser.id } });
  if (!address) {
    console.log("No address found for test user — skipping orders");
    return [];
  }
  const addressId = address.id;

  const createdOrders: any[] = [];

  // helper to create a simple order with one item
  async function createSimpleOrder(status: string, withPayment = false, withShipment = false) {
    const product = products[0];
    const qty = 2;
    const unitPrice = Number(product.price ?? product.basePrice ?? 0);
    const subtotal = Math.round(unitPrice * qty);
    const shippingCost = 5000;
    const discountTotal = 0;
    const grandTotal = subtotal + shippingCost - discountTotal;

  const order = await prisma.order.create({
      data: {
        userId: testUser.id,
        storeId: store.id,
    addressId,
        status: status as any,
        paymentMethod: "MANUAL_TRANSFER",
        subtotalAmount: subtotal,
        shippingCost,
        discountTotal,
        grandTotal,
        totalItems: qty,
        paymentDeadlineAt: new Date(Date.now() + 60 * 60 * 1000),
        items: {
          create: [
            {
              productId: product.id,
              productSnapshot: JSON.stringify({ id: product.id, name: product.name }),
              unitPriceSnapshot: unitPrice,
              qty,
              totalAmount: subtotal,
            },
          ],
        },
      },
      include: { items: true },
    });

    if (withPayment) {
      // create payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          status: status === "PAYMENT_REVIEW" ? "PENDING" : "PAID",
          amount: grandTotal,
          proofImageUrl: status === "PAYMENT_REVIEW" ? "https://example.com/proof.jpg" : null,
          reviewedAt: status === "PAYMENT_REVIEW" ? null : new Date(),
          paidAt: status === "CONFIRMED" || status === "SHIPPED" || status === "PROCESSING" ? new Date() : null,
        },
      });
    }

    if (withShipment) {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          methodId: 1,
          trackingNumber: `TRK-${order.id}-${Date.now()}`,
          cost: shippingCost,
          status: "in_transit",
          shippedAt: new Date(),
        },
      });
    }

    createdOrders.push(order);
    return order;
  }

  // Create sample orders across statuses
  await createSimpleOrder("PENDING_PAYMENT", false, false);
  await createSimpleOrder("PAYMENT_REVIEW", true, false);
  await createSimpleOrder("PROCESSING", true, false);
  await createSimpleOrder("SHIPPED", true, true);
  await createSimpleOrder("CONFIRMED", true, false);
  await createSimpleOrder("CANCELLED", false, false);

  console.log(`✅ Created ${createdOrders.length} sample orders`);
  return createdOrders;
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
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, qty },
      });
    }
  }

  console.log(`✅ Created ${cartUsers.length} sample carts (USER role only)`);
}

async function seedUserAddresses(users: any[]) {
  // Prefer user with id=4 for testing, fallback to first seeded user
  const user = users.find((u) => u.id === 4) ?? users[0];
  console.log(
    `📫 Seeding user addresses for userId=${user?.id ?? "(none)"}...`
  );
  if (!user) {
    console.log("No users available to seed addresses");
    return;
  }

  // Bandung - Home (primary)
  await prisma.userAddress.create({
    data: {
      userId: user.id,
      label: "Rumah",
      recipientName: "Siti Pelanggan",
      addressLine: "Jl. Merdeka No.10",
      province: "Jawa Barat",
      city: "Bandung",
      district: "Sumur Bandung",
      postalCode: "40111",
      latitude: -6.9175,
      longitude: 107.6191,
      isPrimary: true,
    },
  });

  // Jakarta - Office
  await prisma.userAddress.create({
    data: {
      userId: user.id,
      label: "Kantor",
      recipientName: "Siti Pelanggan",
      addressLine: "Jl. Sudirman Kav. 1",
      province: "DKI Jakarta",
      city: "Jakarta",
      district: "Tanah Abang",
      postalCode: "10210",
      latitude: -6.2,
      longitude: 106.8166,
      isPrimary: false,
    },
  });

  console.log(`✅ Seeded 2 addresses for userId=${user.id}`);
}

async function seed() {
  try {
    console.log("🌱 Starting database seeding...\n");

    await cleanDatabase();

    const users = await seedUsers();
    // Seed user addresses early so seedOrders can find an address for the test user
    await seedUserAddresses(users);
    const categories = await seedCategories();
  const stores = await seedStores();
  await seedStoreAssignments(users, stores);
    const products = await seedProducts(categories);

  await seedInventories(stores, products);
  const shippingMethods = await seedShippingMethods();
  await seedOrders(users, stores, products);
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
