import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { LectureQaItem } from "@/app/types";
import { safeWriteJson } from "@/lib/safeWrite";

let cachedQuestions: LectureQaItem[] = [];

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "lecture_qa.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        cachedQuestions = parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read lecture_qa.json from disk, using cache:", err);
  }

  return NextResponse.json({ questions: cachedQuestions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let updatedQuestions: LectureQaItem[] = [];

    if (body.question) {
      updatedQuestions = [body.question, ...cachedQuestions];
    } else if (body.questions && Array.isArray(body.questions)) {
      updatedQuestions = body.questions;
    } else {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    cachedQuestions = updatedQuestions;
    safeWriteJson("lecture_qa.json", updatedQuestions);

    return NextResponse.json({ success: true, questions: cachedQuestions });
  } catch (err) {
    console.error("API Lecture QA POST Error:", err);
    return NextResponse.json({ error: "Failed to update lecture QA" }, { status: 500 });
  }
}
