import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import defaultMealData from "@/meals.json";
import { MealDay } from "@/app/types";

let cachedMeals: MealDay[] | null = null;

function loadMealsFromDisk(): MealDay[] {
  try {
    const filePath = path.join(process.cwd(), "meals.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(fileData);
      if (parsed.meals && Array.isArray(parsed.meals)) {
        return parsed.meals;
      }
    }
  } catch (err) {
    console.warn("[API Meals] Could not read meals.json:", err);
  }
  return defaultMealData.meals as MealDay[];
}

function saveMealsToDisk(items: MealDay[]) {
  try {
    const filePath = path.join(process.cwd(), "meals.json");
    fs.writeFileSync(filePath, JSON.stringify({ meals: items }, null, 2), "utf-8");
  } catch (err) {
    console.warn("[API Meals] Could not write meals.json:", err);
  }
}

export async function GET() {
  if (cachedMeals === null) {
    cachedMeals = loadMealsFromDisk();
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
    saveMealsToDisk(newMeals);

    return NextResponse.json({ success: true, meals: cachedMeals });
  } catch (err) {
    console.error("API Meals POST Error:", err);
    return NextResponse.json({ error: "Failed to update meals" }, { status: 500 });
  }
}
