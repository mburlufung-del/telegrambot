import { storage } from "./storage";

export async function seedDatabase() {
  console.log("Seeding database with sample data...");

  try {
    // Create sample categories
    const categories = [
      {
        name: "Pharmaceuticals",
        description: "Professional medical and pharmaceutical products",
        isActive: true
      },
      {
        name: "Health & Wellness",
        description: "Health supplements and wellness products",
        isActive: true
      },
      {
        name: "Medical Devices",
        description: "Professional medical equipment and devices",
        isActive: true
      }
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
      const category = await storage.createCategory(categoryData);
      createdCategories.push(category);
      console.log(`Created category: ${category.name}`);
    }

    // Create sample products
    const products = [
      {
        name: "Premium Vitamin D3 5000 IU",
        description: "High-potency Vitamin D3 supplement for bone health and immune support. Professional-grade formulation with superior bioavailability. Third-party tested for purity and potency.",
        price: "29.99",
        compareAtPrice: "39.99",
        stock: 150,
        minOrderQuantity: 1,
        maxOrderQuantity: 10,
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&crop=center",
        categoryId: createdCategories[1].id,
        tags: JSON.stringify(["vitamin", "supplement", "immune", "bone health"]),
        specifications: JSON.stringify({
          "Strength": "5000 IU",
          "Form": "Softgel Capsules",
          "Count": "120 capsules",
          "Serving Size": "1 capsule",
          "Third Party Tested": "Yes"
        }),
        isActive: true,
        isFeatured: true
      },
      {
        name: "Blood Pressure Monitor Pro",
        description: "Clinical-grade automatic blood pressure monitor with advanced accuracy technology. Features large LCD display, memory storage, and irregular heartbeat detection.",
        price: "159.99",
        compareAtPrice: "199.99",
        stock: 45,
        minOrderQuantity: 1,
        maxOrderQuantity: 3,
        imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop&crop=center",
        categoryId: createdCategories[2].id,
        tags: JSON.stringify(["blood pressure", "monitor", "medical device", "health"]),
        specifications: JSON.stringify({
          "Accuracy": "±3 mmHg",
          "Cuff Size": "22-42 cm",
          "Memory": "2 x 60 readings",
          "Display": "Large LCD",
          "Warranty": "2 years"
        }),
        isActive: true,
        isFeatured: true
      },
      {
        name: "Omega-3 Fish Oil 1000mg",
        description: "Premium fish oil supplement with EPA and DHA for cardiovascular and brain health. Molecular distillation ensures purity and removes heavy metals.",
        price: "24.99",
        compareAtPrice: "34.99",
        stock: 200,
        minOrderQuantity: 1,
        maxOrderQuantity: 6,
        imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8da6?w=400&h=400&fit=crop&crop=center",
        categoryId: createdCategories[1].id,
        tags: JSON.stringify(["omega-3", "fish oil", "heart health", "brain health"]),
        specifications: JSON.stringify({
          "EPA": "300mg",
          "DHA": "200mg",
          "Form": "Softgel",
          "Count": "180 capsules",
          "Purity": "Molecular distilled"
        }),
        isActive: true,
        isFeatured: false
      },
      {
        name: "Digital Thermometer",
        description: "Fast and accurate digital thermometer with fever alarm. Waterproof design with flexible tip for comfort and safety.",
        price: "12.99",
        compareAtPrice: "19.99",
        stock: 80,
        minOrderQuantity: 1,
        maxOrderQuantity: 5,
        imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=400&fit=crop&crop=center",
        categoryId: createdCategories[2].id,
        tags: JSON.stringify(["thermometer", "digital", "fever", "medical"]),
        specifications: JSON.stringify({
          "Accuracy": "±0.1°C",
          "Range": "32.0°C - 42.9°C",
          "Memory": "Last reading",
          "Battery": "LR41",
          "Waterproof": "Yes"
        }),
        isActive: true,
        isFeatured: false
      },
      {
        name: "Probiotic Complex 50 Billion CFU",
        description: "Advanced probiotic formula with 12 strains and 50 billion CFU for digestive and immune health. Delayed-release capsules ensure maximum potency.",
        price: "44.99",
        compareAtPrice: "59.99",
        stock: 120,
        minOrderQuantity: 1,
        maxOrderQuantity: 4,
        imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8da6?w=400&h=400&fit=crop&crop=center",
        categoryId: createdCategories[1].id,
        tags: JSON.stringify(["probiotic", "digestive health", "immune", "gut health"]),
        specifications: JSON.stringify({
          "CFU Count": "50 billion",
          "Strains": "12 probiotic strains",
          "Form": "Delayed-release capsules",
          "Count": "60 capsules",
          "Refrigeration": "Not required"
        }),
        isActive: true,
        isFeatured: true
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = await storage.createProduct(productData);
      createdProducts.push(product);
      console.log(`Created product: ${product.name}`);
    }

    // Create bot settings
    const botSettings = [
      { key: "welcome_message", value: "🛍️ Welcome to TeleShop! Your professional health and wellness destination.\n\n📱 Use the menu below to browse our catalog\n🛒 Add items to your cart\n💬 Contact us for assistance\n\nHealthy shopping!" },
      { key: "help_message", value: "🔹 Available Commands:\n\n🏠 Main Menu - Return to main options\n📦 Catalog - Browse all products\n🛒 Cart - View your shopping cart\n📋 Orders - Check your order history\n❤️ Wishlist - Save items for later\n👤 Contact - Speak with our team\n\n💡 Tips:\n• Use +/- buttons to adjust quantities\n• Tap product images for details\n• We're here to help with any questions!" },
      { key: "contact_message", value: "📞 Contact Information:\n\n👤 Operator: @murzion\n📧 Email: support@teleshop.com\n📱 Telegram: Direct message our operator\n🕒 Hours: Mon-Fri 9AM-6PM EST\n\n💬 Send us a message anytime and we'll respond within 24 hours!" },
      { key: "order_confirmation", value: "✅ Order confirmed! We'll process your order and contact you within 24 hours with shipping details.\n\n📦 You'll receive tracking information once your order ships.\n💬 Contact @murzion if you have any questions." },
      { key: "payment_methods", value: "💳 Payment Methods:\n• Cash on Delivery\n• Bank Transfer\n• Credit/Debit Card\n• PayPal\n• Bitcoin & Cryptocurrency" }
    ];

    for (const setting of botSettings) {
      await storage.setBotSetting(setting);
      console.log(`Set bot setting: ${setting.key}`);
    }

    // Create sample product ratings
    const sampleRatings = [
      { productId: createdProducts[0].id, telegramUserId: "123456789", rating: 5 },
      { productId: createdProducts[0].id, telegramUserId: "987654321", rating: 4 },
      { productId: createdProducts[0].id, telegramUserId: "456789123", rating: 5 },
      { productId: createdProducts[1].id, telegramUserId: "123456789", rating: 5 },
      { productId: createdProducts[1].id, telegramUserId: "789123456", rating: 4 },
      { productId: createdProducts[2].id, telegramUserId: "321654987", rating: 4 },
      { productId: createdProducts[2].id, telegramUserId: "654987321", rating: 5 },
      { productId: createdProducts[3].id, telegramUserId: "147258369", rating: 4 },
      { productId: createdProducts[4].id, telegramUserId: "963852741", rating: 5 }
    ];

    for (const rating of sampleRatings) {
      await storage.addProductRating(rating);
    }
    console.log(`Created ${sampleRatings.length} product ratings`);

    // Create sample orders
    const sampleOrders = [
      {
        telegramUserId: "7996630474",
        customerName: "John Smith",
        contactInfo: "+1-555-0123",
        deliveryAddress: "123 Main St, New York, NY 10001",
        totalAmount: "189.97",
        status: "delivered",
        paymentMethod: "credit_card",
        items: JSON.stringify([
          { productId: createdProducts[0].id, productName: createdProducts[0].name, quantity: 2, price: createdProducts[0].price, total: "59.98" },
          { productId: createdProducts[1].id, productName: createdProducts[1].name, quantity: 1, price: createdProducts[1].price, total: "159.99" }
        ])
      },
      {
        telegramUserId: "7996630474",
        customerName: "John Smith",
        contactInfo: "+1-555-0123",
        deliveryAddress: "123 Main St, New York, NY 10001",
        totalAmount: "69.98",
        status: "shipped",
        paymentMethod: "paypal",
        items: JSON.stringify([
          { productId: createdProducts[2].id, productName: createdProducts[2].name, quantity: 1, price: createdProducts[2].price, total: "24.99" },
          { productId: createdProducts[4].id, productName: createdProducts[4].name, quantity: 1, price: createdProducts[4].price, total: "44.99" }
        ])
      },
      {
        telegramUserId: "8877665544",
        customerName: "Sarah Johnson",
        contactInfo: "+1-555-0456",
        deliveryAddress: "456 Oak Ave, Los Angeles, CA 90210",
        totalAmount: "37.98",
        status: "completed",
        paymentMethod: "bitcoin",
        items: JSON.stringify([
          { productId: createdProducts[3].id, productName: createdProducts[3].name, quantity: 2, price: createdProducts[3].price, total: "25.98" },
          { productId: createdProducts[0].id, productName: createdProducts[0].name, quantity: 1, price: createdProducts[0].price, total: "29.99" }
        ])
      }
    ];

    for (const orderData of sampleOrders) {
      await storage.createOrder(orderData);
    }
    console.log(`Created ${sampleOrders.length} sample orders`);

    // Update bot stats
    await storage.updateBotStats({
      totalUsers: 25,
      totalOrders: sampleOrders.length,
      totalMessages: 184,
      totalRevenue: "297.93"
    });
    console.log("Updated bot statistics");

    console.log("Database seeding completed successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
}