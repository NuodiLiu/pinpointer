import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { IncomingForm, File } from "formidable";
import type { IncomingMessage } from "http";
import { Readable } from "stream";

// make sure `saved_routes` folder exists
const SAVE_DIRECTORY = path.join(process.cwd(), "saved_routes");
if (!fs.existsSync(SAVE_DIRECTORY)) {
  fs.mkdirSync(SAVE_DIRECTORY, { recursive: true });
}

// Disable default body parsing (needed for file upload)
export const config = {
  api: {
    bodyParser: false,
  },
};

// change NextRequest to IncomingMessage（for formidable）
async function convertToIncomingMessage(req: NextRequest): Promise<IncomingMessage> {
  const requestBuffer = await req.arrayBuffer();
  const readableStream = new Readable();

  readableStream.push(Buffer.from(requestBuffer));
  readableStream.push(null);

  readableStream.on("error", (err) => console.error("❌ ReadableStream error:", err));
  readableStream.on("close", () => console.log("✅ ReadableStream closed"));

  return Object.assign(readableStream, {
    headers: Object.fromEntries(req.headers),
    method: req.method,
    url: req.nextUrl.pathname,
  }) as IncomingMessage;
}

// Generate a unique filename
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

// Handle file upload
export async function POST(req: NextRequest) {
  try {
    const incomingRequest = await convertToIncomingMessage(req);

    return new Promise((resolve, reject) => {
      const form = new IncomingForm({
        uploadDir: SAVE_DIRECTORY,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        multiples: false,
      });

      form.parse(incomingRequest, (err, fields, files) => {
        if (err) {
          console.error("❌ Failed to parse uploaded file:", err);
          incomingRequest.resume(); //✅ Continue consuming remaining data to prevent blocking
          return resolve(
            NextResponse.json({ message: "Failed to upload", error: err.message }, { status: 400 })
          );
        }
      
        console.log("📂 File parsed successfully:", files);
        incomingRequest.resume(); // ✅ Ensure data is fully read
        const uploadedFileArray = files.file as File[] | undefined;
        if (!uploadedFileArray || uploadedFileArray.length === 0) {
          incomingRequest.destroy(); // ✅ Ensure stream is destroyed
          return resolve(
            NextResponse.json({ message: "Invalid file upload" }, { status: 400 })
          );
        }
      
        const uploadedFile = uploadedFileArray[0]; 
        const originalFilename = uploadedFile.originalFilename || "uploaded_file";
        const finalFilePath = getUniqueFilename(SAVE_DIRECTORY, originalFilename);
      
        fs.rename(uploadedFile.filepath, finalFilePath, (renameError) => {
          if (renameError) {
            console.error("❌ Failed to save file:", renameError);
            incomingRequest.destroy(); // ✅ Ensure stream is released
            return resolve(
              NextResponse.json({ message: "File uploaded successfully" }, { status: 500 })
            );
          }
      
          console.log(`✅ File uploaded successfully: ${finalFilePath}`);
          incomingRequest.destroy();
      
          resolve(
            NextResponse.json({ message: "File uploaded successfully", filePath: finalFilePath })
          );
        });
      });
      
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ message: "Server Error", error }, { status: 500 });
  }
}
