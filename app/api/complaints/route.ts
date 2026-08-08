import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ComplaintItem, AdminReply } from "@/app/types";

function getFilePath(): string {
  return path.join(process.cwd(), "complaints.json");
}

function readComplaintsFromDisk(): ComplaintItem[] {
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
    console.warn("[Board API Complaints] Read error:", err);
  }
  return [];
}

function writeComplaintsToDisk(list: ComplaintItem[]) {
  try {
    const filePath = getFilePath();
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Board API Complaints] Write error:", err);
  }
}

// GET: 게시글 전체 목록 조회
export async function GET() {
  const complaints = readComplaintsFromDisk();
  return NextResponse.json({ success: true, complaints });
}

// POST: 개별 글 작성 / 삭제 / 답변 / 상태 변경 (디시인사이드/기업 게시판 방식)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    let list = readComplaintsFromDisk();

    if (action === "create") {
      // 1. 새 민원글 작성
      const { title, content, author, isPrivate, passcode } = body;
      if (!title || !content) {
        return NextResponse.json({ error: "제목과 내용을 입력해 주세요." }, { status: 400 });
      }

      const newPost: ComplaintItem = {
        id: "post_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        content: content.trim(),
        author: (author || "익명").trim(),
        isPrivate: Boolean(isPrivate),
        passcode: (passcode || "").trim(),
        createdAt: new Date().toISOString(),
        status: "pending",
        replies: [],
      };

      list = [newPost, ...list];
      writeComplaintsToDisk(list);
      return NextResponse.json({ success: true, complaint: newPost, complaints: list });
    }

    if (action === "delete") {
      // 2. 개별 글 삭제
      const { id } = body;
      if (!id) return NextResponse.json({ error: "글 ID가 필요합니다." }, { status: 400 });

      list = list.filter((item) => item.id !== id);
      writeComplaintsToDisk(list);
      return NextResponse.json({ success: true, deletedId: id, complaints: list });
    }

    if (action === "reply") {
      // 3. 임원진 답변 등록
      const { id, author: replyAuthor, content: replyContent } = body;
      if (!id || !replyContent) {
        return NextResponse.json({ error: "답변 내용을 입력해 주세요." }, { status: 400 });
      }

      const newReply: AdminReply = {
        id: "rep_" + Date.now(),
        author: (replyAuthor || "임원진").trim(),
        content: replyContent.trim(),
        createdAt: new Date().toISOString(),
      };

      list = list.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "resolved" as const,
              replies: [...(item.replies || []), newReply],
            }
          : item
      );

      writeComplaintsToDisk(list);
      return NextResponse.json({ success: true, complaints: list });
    }

    if (action === "toggle_status") {
      // 4. 처리 상태 변경 (대기 <-> 완료)
      const { id } = body;
      list = list.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "resolved" ? "pending" : "resolved" }
          : item
      );
      writeComplaintsToDisk(list);
      return NextResponse.json({ success: true, complaints: list });
    }

    return NextResponse.json({ error: "유효하지 않은 action 요청입니다." }, { status: 400 });
  } catch (err) {
    console.error("[Board API Complaints POST Error]:", err);
    return NextResponse.json({ error: "서버 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
