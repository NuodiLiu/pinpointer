import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { IncomingForm, File } from "formidable";
import type { IncomingMessage } from "http";
import { Readable } from "stream";

// 确保 `saved_routes` 目录存在
const SAVE_DIRECTORY = path.join(process.cwd(), "saved_routes");
if (!fs.existsSync(SAVE_DIRECTORY)) {
  fs.mkdirSync(SAVE_DIRECTORY, { recursive: true });
}

// 关闭默认的 body 解析（适用于文件上传）
export const config = {
  api: {
    bodyParser: false,
  },
};

// 转换 NextRequest 为 IncomingMessage（因为 formidable 需要）
async function convertToIncomingMessage(req: NextRequest): Promise<IncomingMessage> {
  const requestBuffer = await req.arrayBuffer();
  const readableStream = new Readable();

  readableStream.push(Buffer.from(requestBuffer));
  readableStream.push(null);

  // 关键点：确保第二次上传时，不会因为流未关闭而阻塞
  readableStream.on("error", (err) => console.error("❌ ReadableStream 错误:", err));
  readableStream.on("close", () => console.log("✅ ReadableStream 关闭"));

  return Object.assign(readableStream, {
    headers: Object.fromEntries(req.headers),
    method: req.method,
    url: req.nextUrl.pathname,
  }) as IncomingMessage;
}

// 生成唯一文件名
function getUniqueFilename(directory: string, filename: string): string {
  let finalFilePath = path.join(directory, filename);
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  let counter = 1;

  while (fs.existsSync(finalFilePath)) {
    finalFilePath = path.join(directory, `${baseName} (${counter})${ext}`);
    counter++;
  }

  return finalFilePath;
}

// 处理文件上传
export async function POST(req: NextRequest) {
  try {
    const incomingRequest = await convertToIncomingMessage(req);

    return new Promise((resolve, reject) => {
      const form = new IncomingForm({
        uploadDir: SAVE_DIRECTORY,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        multiples: false, // 确保只上传一个文件
      });

      form.parse(incomingRequest, (err, fields, files) => {
        if (err) {
          console.error("❌ 解析上传文件失败:", err);
          incomingRequest.resume(); // ✅ 继续消费剩余数据，防止阻塞
          return resolve(
            NextResponse.json({ message: "文件上传失败", error: err.message }, { status: 400 })
          );
        }
      
        console.log("📂 文件解析成功:", files);
        incomingRequest.resume(); // ✅ 确保数据被完全读取
        const uploadedFileArray = files.file as File[] | undefined;
        if (!uploadedFileArray || uploadedFileArray.length === 0) {
          incomingRequest.destroy(); // ✅ 确保流被销毁
          return resolve(
            NextResponse.json({ message: "无效的文件上传" }, { status: 400 })
          );
        }
      
        const uploadedFile = uploadedFileArray[0]; 
        const originalFilename = uploadedFile.originalFilename || "uploaded_file";
        const finalFilePath = getUniqueFilename(SAVE_DIRECTORY, originalFilename);
      
        fs.rename(uploadedFile.filepath, finalFilePath, (renameError) => {
          if (renameError) {
            console.error("❌ 保存文件失败:", renameError);
            incomingRequest.destroy(); // ✅ 确保流被释放
            return resolve(
              NextResponse.json({ message: "保存文件失败" }, { status: 500 })
            );
          }
      
          console.log(`✅ 文件上传成功: ${finalFilePath}`);
          incomingRequest.destroy(); // ✅ 解析完成后销毁流
      
          resolve(
            NextResponse.json({ message: "文件上传成功", filePath: finalFilePath })
          );
        });
      });
      
    });
  } catch (error) {
    console.error("❌ 服务器错误:", error);
    return NextResponse.json({ message: "服务器错误", error }, { status: 500 });
  }
}
