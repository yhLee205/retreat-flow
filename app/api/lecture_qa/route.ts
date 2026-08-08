import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { LectureQaItem } from "@/app/types";

let cachedQuestions: LectureQaItem[] | null = null;

function loadQuestionsFromDisk(): LectureQaItem[] {
  try {
    const filePath = path.join(process.cwd(), "lecture_qa.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[API Lecture QA] Could not read lecture_qa.json:", err);
  }
  return [];
}

function saveQuestionsToDisk(items: LectureQaItem[]) {
  try {
    const filePath = path.join(process.cwd(), "lecture_qa.json");
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.warn("[API Lecture QA] Could not write lecture_qa.json:", err);
  }
}

export async function GET() {
  if (cachedQuestions === null) {
    cachedQuestions = loadQuestionsFromDisk();
  }
  return NextResponse.json({ questions: cachedQuestions });
}

export async function POST(request: Request) {
  try {
    if (cachedQuestions === null) {
      cachedQuestions = loadQuestionsFromDisk();
    }

    const body = await request.json();
    let updatedQuestions: LectureQaItem[] = [];

    if (body.question) {
      const existing = cachedQuestions.filter((q) => q.id !== body.question.id);
      updatedQuestions = [body.question, ...existing];
    } else if (body.questions && Array.isArray(body.questions)) {
      updatedQuestions = body.questions;
    } else {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    cachedQuestions = updatedQuestions;
    saveQuestionsToDisk(updatedQuestions);

    return NextResponse.json({ success: true, questions: cachedQuestions });
  } catch (err) {
    console.error("API Lecture QA POST Error:", err);
    return NextResponse.json({ error: "Failed to update lecture QA" }, { status: 500 });
  }
}
