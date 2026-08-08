import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { LectureQaItem } from "@/app/types";

function getFilePath(): string {
  return path.join(process.cwd(), "lecture_qa.json");
}

function readQuestionsFromDisk(): LectureQaItem[] {
  try {
    const filePath = getFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Board API Lecture QA] Read error:", err);
  }
  return [];
}

function writeQuestionsToDisk(list: LectureQaItem[]) {
  try {
    const filePath = getFilePath();
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Board API Lecture QA] Write error:", err);
  }
}

// GET: Q&A 질문 목록 전체 조회
export async function GET() {
  const questions = readQuestionsFromDisk();
  return NextResponse.json({ success: true, questions });
}

// POST: 질문 작성 / 공감 / 목사님 답변 / 삭제 개별 처리
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    let list = readQuestionsFromDisk();

    if (action === "create") {
      // 1. 새 질문 작성
      const { question, author } = body;
      if (!question) {
        return NextResponse.json({ error: "질문 내용을 입력해 주세요." }, { status: 400 });
      }

      const newQa: LectureQaItem = {
        id: "qa_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        question: question.trim(),
        author: (author || "익명 청년").trim(),
        likes: 0,
        createdAt: new Date().toISOString(),
      };

      list = [newQa, ...list];
      writeQuestionsToDisk(list);
      return NextResponse.json({ success: true, question: newQa, questions: list });
    }

    if (action === "like") {
      // 2. 개별 질문 공감 (좋아요 +1)
      const { id } = body;
      list = list.map((item) =>
        item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item
      );
      writeQuestionsToDisk(list);
      return NextResponse.json({ success: true, questions: list });
    }

    if (action === "pastor_answer") {
      // 3. 목사님/강사님 답변 기록
      const { id, pastorAnswer } = body;
      list = list.map((item) =>
        item.id === id
          ? { ...item, pastorAnswer: (pastorAnswer || "").trim(), answeredAt: new Date().toISOString() }
          : item
      );
      writeQuestionsToDisk(list);
      return NextResponse.json({ success: true, questions: list });
    }

    if (action === "delete") {
      // 4. 개별 질문 삭제
      const { id } = body;
      list = list.filter((item) => item.id !== id);
      writeQuestionsToDisk(list);
      return NextResponse.json({ success: true, deletedId: id, questions: list });
    }

    return NextResponse.json({ error: "유효하지 않은 action 요청입니다." }, { status: 400 });
  } catch (err) {
    console.error("[Board API Lecture QA POST Error]:", err);
    return NextResponse.json({ error: "서버 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
