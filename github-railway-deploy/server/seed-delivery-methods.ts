import { db } from "./db";
import { deliveryMethods } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultDeliveryMethods = [
  {
    id: "1",
    name: "Standard Delivery",
    description: "Regular shipping via postal service",
    price: "0.00",
    estimatedDays: "3-7 days",
    requiresAddress: true,
    isActive: true,
    sortOrder: 1
  },
  {
    id: "2", 
    name: "Express Delivery",
    description: "Fast delivery service",
    price: "15.00",
    estimatedDays: "1-2 days",
    requiresAddress: true,
    isActive: true,
    sortOrder: 2
  },
  {
    id: "3",
    name: "Store Pickup",
    description: "Collect from our store location",
    price: "0.00",
    estimatedDays: "Same day",
    requiresAddress: false,
    isActive: true,
    sortOrder: 3
  },
  {
    id: "4",
    name: "Priority Shipping", 
    description: "Next day delivery service",
    price: "25.00",
    estimatedDays: "Next day",
    requiresAddress: true,
    isActive: true,
    sortOrder: 4
  }
];

export async function seedDeliveryMethods() {
  console.log("Seeding delivery methods...");
  
  for (const method of defaultDeliveryMethods) {
    try {
      // Check if method already exists
      const existing = await db.select().from(deliveryMethods).where(eq(deliveryMethods.id, method.id));
      
      if (existing.length === 0) {
        await db.insert(deliveryMethods).values({
          ...method,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created delivery method: ${method.name}`);
      } else {
        console.log(`Delivery method already exists: ${method.name}`);
      }
    } catch (error) {
      console.error(`Error seeding delivery method ${method.name}:`, error);
    }
  }
  
  console.log("Delivery methods seeding completed");
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  seedDeliveryMethods().then(() => process.exit(0)).catch(console.error);
}