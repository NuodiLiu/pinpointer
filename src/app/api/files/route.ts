import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

// process.cwd() should go to root directory
const DATA_FOLDER = path.join(process.cwd(), "saved_routes");

const ensureDataFolder = () => {
  if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER);
  }
};

// GET: get file list or a single file
export async function GET(request: Request) {
  ensureDataFolder();

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");

  if (fileName) {
    const filePath = path.join(DATA_FOLDER, fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const fileData = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(fileData));
  } else {
    const files = fs.readdirSync(DATA_FOLDER).filter((file) => file.endsWith(".json"));
    return NextResponse.json(files);
  }
}

// POST: save file
export async function POST(request: Request) {
  ensureDataFolder();

  const body = await request.json();
  const { fileName, data } = body;

  if (!fileName || !data) {
    return NextResponse.json({ error: "Missing fileName or data" }, { status: 400 });
  }

  const filePath = path.join(DATA_FOLDER, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true });
}

// DELETE: delete a file
export async function DELETE(request: Request) {
  ensureDataFolder();

  const body = await request.json();
  const { fileName } = body;

  if (!fileName) {
    return NextResponse.json({ error: "Missing fileName" }, { status: 400 });
  }

  const filePath = path.join(DATA_FOLDER, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
