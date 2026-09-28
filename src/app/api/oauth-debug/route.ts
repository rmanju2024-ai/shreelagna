import { NextResponse } from "next/server";
import { readFileSync } from "fs";

export async function GET() {
  try {
    const logFile = "/tmp/.oauth_debug.log";
    const logs = readFileSync(logFile, "utf-8");
    
    return NextResponse.json({
      logs: logs.split("\n").filter(Boolean),
      count: logs.split("\n").filter(Boolean).length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      error: "Could not read logs",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
