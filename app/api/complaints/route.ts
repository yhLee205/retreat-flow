import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ComplaintItem } from "@/app/types";

let cachedComplaints: ComplaintItem[] | null = null;

function loadComplaintsFromDisk(): ComplaintItem[] {
  try {
    const filePath = path.join(process.cwd(), "complaints.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[API Complaints] Could not read complaints.json:", err);
  }
  return [];
}

function saveComplaintsToDisk(items: ComplaintItem[]) {
  try {
    const filePath = path.join(process.cwd(), "complaints.json");
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.warn("[API Complaints] Could not write complaints.json:", err);
  }
}

export async function GET() {
  if (cachedComplaints === null) {
    cachedComplaints = loadComplaintsFromDisk();
  }
  return NextResponse.json({ complaints: cachedComplaints });
}

export async function POST(request: Request) {
  try {
    if (cachedComplaints === null) {
      cachedComplaints = loadComplaintsFromDisk();
    }

    const body = await request.json();
    let updatedComplaints: ComplaintItem[] = [];

    if (body.complaint) {
      // Prevent duplicates by ID
      const existing = cachedComplaints.filter((c) => c.id !== body.complaint.id);
      updatedComplaints = [body.complaint, ...existing];
    } else if (body.complaints && Array.isArray(body.complaints)) {
      updatedComplaints = body.complaints;
    } else {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    cachedComplaints = updatedComplaints;
    saveComplaintsToDisk(updatedComplaints);

    return NextResponse.json({ success: true, complaints: cachedComplaints });
  } catch (err) {
    console.error("API Complaints POST Error:", err);
    return NextResponse.json({ error: "Failed to update complaints" }, { status: 500 });
  }
}
