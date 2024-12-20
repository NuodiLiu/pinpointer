import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 定义文件目录
const FILES_DIR = path.resolve("./saved_routes");

// 确保文件目录存在
function ensureFilesDir() {
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }
}

// POST: 重命名文件
export async function POST(request: Request) {
  ensureFilesDir();

  try {
    const body = await request.json();
    const { oldName, newName, isPending } = body; // 前端传入的数据字段名修改为这三个

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
      // 情况 1: 未保存文件，仅修改内存中的名字，不对本地文件进行操作
      // 前端只是在 "New Route" 状态下修改了临时名称，尚未执行保存
      return NextResponse.json({
        success: true,
        message: "Pending file renamed successfully.",
      });
    } else {
      // 情况 2: 已存在文件，执行重命名操作

      // 检查旧文件是否存在
      if (!fs.existsSync(oldPath)) {
        return NextResponse.json(
          { error: "Original file not found." },
          { status: 404 }
        );
      }

      // 检查目标文件是否已存在
      if (fs.existsSync(newPath)) {
        return NextResponse.json(
          { error: "Target file name already exists." },
          { status: 409 }
        );
      }

      // 执行重命名操作
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
