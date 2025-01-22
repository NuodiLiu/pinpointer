// api/files/rename/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILES_DIR = path.resolve("./saved_routes");

function ensureFilesDir() {
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }
}

export async function POST(request: Request) {
  ensureFilesDir();

  try {
    const body = await request.json();
    const { oldName, newName, isPending } = body;

    console.log("Received rename request:", { oldName, newName, isPending });

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: "File names are required." },
        { status: 400 }
      );
    }

    const oldPath = path.join(FILES_DIR, oldName);
    const newPath = path.join(FILES_DIR, newName);

    if (isPending) {
      return NextResponse.json({
        success: true,
        message: "Pending file renamed successfully.",
      });
    } else {
      if (!fs.existsSync(oldPath)) {
        return NextResponse.json(
          { error: "Original file not found." },
          { status: 404 }
        );
      }

      if (fs.existsSync(newPath)) {
        return NextResponse.json(
          { error: "Target file name already exists." },
          { status: 409 }
        );
      }
      
      fs.renameSync(oldPath, newPath);
      return NextResponse.json({
        success: true,
        message: "File renamed successfully.",
      });
    }
  } catch (error) {
    console.error("Error renaming file:", error);
    return NextResponse.json(
      { error: "Error renaming file." },
      { status: 500 }
    );
  }
}
