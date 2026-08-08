import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import defaultMealData from "@/meals.json";
import { MealDay } from "@/app/types";

// In-memory cache for dynamic updates across all clients
let cachedMeals: MealDay[] = defaultMealData.meals as MealDay[];

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "meals.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(fileData);
      if (parsed.meals && Array.isArray(parsed.meals)) {
        cachedMeals = parsed.meals;
      }
    }
  } catch (err) {
    console.warn("Could not read meals.json from disk, using cache:", err);
  }

  return NextResponse.json({ meals: cachedMeals });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMeals: MealDay[] = body.meals;

    if (!newMeals || !Array.isArray(newMeals)) {
      return NextResponse.json({ error: "Invalid meals data" }, { status: 400 });
    }

    cachedMeals = newMeals;

    // Save to meals.json on disk if writable
    try {
      const filePath = path.join(process.cwd(), "meals.json");
      fs.writeFileSync(filePath, JSON.stringify({ meals: newMeals }, null, 2), "utf-8");
    } catch (fsErr) {
      console.warn("Disk write warning (read-only environment):", fsErr);
    }

    return NextResponse.json({ success: true, meals: cachedMeals });
  } catch (err) {
    console.error("API Meals POST Error:", err);
    return NextResponse.json({ error: "Failed to update meals" }, { status: 500 });
  }
}
