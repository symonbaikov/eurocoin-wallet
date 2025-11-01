import { getTelegramApi } from "./bot";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export async function sendFilesToTelegram(
  chatId: string,
  files: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: Buffer;
  }>,
): Promise<void> {
  const telegram = getTelegramApi();

  try {
    // Send text message with file count
    const filesInfo = files.length > 0 ? `\n📎 *Прикрепленные файлы:* ${files.length} шт.` : "";

    await telegram.sendMessage(chatId, filesInfo, { parse_mode: "Markdown" });

    // Send each file
    for (const file of files) {
      // Determine file caption
      const caption = `📎 ${file.fileName} (${formatFileSize(file.fileSize)})`;

      // Determine file type and send accordingly
      if (file.fileType === "application/pdf") {
        // Send PDF as document
        await telegram.sendDocument(
          chatId,
          {
            source: file.fileData,
            filename: file.fileName,
          },
          {
            caption: caption,
          },
        );
      } else if (
        file.fileType.includes("spreadsheet") ||
        file.fileType.includes("excel") ||
        file.fileName.endsWith(".xls") ||
        file.fileName.endsWith(".xlsx")
      ) {
        // Send Excel as document
        await telegram.sendDocument(
          chatId,
          {
            source: file.fileData,
            filename: file.fileName,
          },
          {
            caption: caption,
          },
        );
      } else if (
        file.fileType.includes("word") ||
        file.fileType.includes("document") ||
        file.fileName.endsWith(".doc") ||
        file.fileName.endsWith(".docx")
      ) {
        // Send Word as document
        await telegram.sendDocument(
          chatId,
          {
            source: file.fileData,
            filename: file.fileName,
          },
          {
            caption: caption,
          },
        );
      } else {
        // Send as document (generic)
        await telegram.sendDocument(
          chatId,
          {
            source: file.fileData,
            filename: file.fileName,
          },
          {
            caption: caption,
          },
        );
      }
    }
  } catch (error) {
    console.error("Error sending files to Telegram:", error);
    throw error;
  }
}

