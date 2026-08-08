import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ComplaintItem } from "@/app/types";

let cachedComplaints: ComplaintItem[] = [];

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "complaints.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        cachedComplaints = parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read complaints.json from disk, using cache:", err);
  }

  return NextResponse.json({ complaints: cachedComplaints });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let updatedComplaints: ComplaintItem[] = [];

    if (body.complaint) {
      // Single new complaint to prepend
      updatedComplaints = [body.complaint, ...cachedComplaints];
    } else if (body.complaints && Array.isArray(body.complaints)) {
      // Full list update (e.g. admin reply, status change, delete)
      updatedComplaints = body.complaints;
    } else {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    cachedComplaints = updatedComplaints;

    try {
      const filePath = path.join(process.cwd(), "complaints.json");
      fs.writeFileSync(filePath, JSON.stringify(updatedComplaints, null, 2), "utf-8");
    } catch (fsErr) {
      console.warn("Disk write warning for complaints.json:", fsErr);
    }

    return NextResponse.json({ success: true, complaints: cachedComplaints });
  } catch (err) {
    console.error("API Complaints POST Error:", err);
    return NextResponse.json({ error: "Failed to update complaints" }, { status: 500 });
  }
}
