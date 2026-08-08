import fs from "fs";
import path from "path";

// 파일 연사 기록 방지용 쓰기 락 (File Write Lock & Queue)
const writeTimeouts = new Map<string, NodeJS.Timeout>();

export function safeWriteJson(fileName: string, data: any) {
  const filePath = path.join(process.cwd(), fileName);

  // 이미 예약된 쓰기 작업이 있다면 취소 후 최신 데이터로 재예약 (Debounce 300ms)
  if (writeTimeouts.has(fileName)) {
    clearTimeout(writeTimeouts.get(fileName)!);
  }

  const timeout = setTimeout(() => {
    try {
      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, content, "utf-8");
    } catch (err) {
      console.warn(`[SafeWrite] Disk write warning for ${fileName}:`, err);
    } finally {
      writeTimeouts.delete(fileName);
    }
  }, 300);

  writeTimeouts.set(fileName, timeout);
}
