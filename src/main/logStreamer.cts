import * as http from "node:http";
import * as os from "node:os";
import { BrowserWindow } from "electron";
import type { LogMessage } from "../shared/types";

const DOCKER_SOCKET =
  os.platform() === "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock";

export class DockerLogStreamer {
  private activeRequest: http.ClientRequest | null = null;
  private logBuffer: LogMessage[] = [];
  private flushIntervalId: NodeJS.Timeout | null = null;

  // Tuning parameters for Backpressure
  private readonly FLUSH_INTERVAL_MS = 100; // Flush to UI 10 times per second
  private readonly MAX_BATCH_SIZE = 500; // Or flush immediately if we hit 500 lines

  constructor(
    private window: BrowserWindow,
    private containerName: string,
  ) {}

  public start() {
    console.log(`Starting log stream for: ${this.containerName}`);

    // 1. Setup the Interval Flusher
    this.flushIntervalId = setInterval(
      () => this.flushLogs(),
      this.FLUSH_INTERVAL_MS,
    );

    // 2. Connect to the Docker API (follow=1 keeps the stream open, tail=100 gets recent history)
    const options: http.RequestOptions = {
      socketPath: DOCKER_SOCKET,
      path: `/containers/${this.containerName}/logs?stdout=1&stderr=1&follow=1&tail=100`,
      method: "GET",
      headers: { Host: "http" },
    };

    this.activeRequest = http.request(options, (res) => {
      let unparsedBuffer = Buffer.alloc(0);

      res.on("data", (chunk: Buffer) => {
        // Append new data to whatever we haven't parsed yet
        unparsedBuffer = Buffer.concat([unparsedBuffer, chunk]);

        // 3. The 8-Byte Multiplex Demuxer Loop
        while (unparsedBuffer.length >= 8) {
          // Read the 32-bit Big-Endian payload size from bytes 4-7
          const payloadSize = unparsedBuffer.readUInt32BE(4);
          const totalFrameLength = 8 + payloadSize;

          // If we haven't received the full payload yet, wait for the next chunk
          if (unparsedBuffer.length < totalFrameLength) break;

          // Extract the payload type (1 = stdout, 2 = stderr)
          const streamType = unparsedBuffer[0] === 1 ? "info" : "error";

          // Slice out the actual log text (ignoring the 8-byte header)
          const payloadBuffer = unparsedBuffer.subarray(8, totalFrameLength);
          const text = payloadBuffer.toString("utf8").trim();

          if (text) {
            this.queueLog({
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              level: streamType,
              containerName: this.containerName,
              message: text,
            });
          }

          // Advance the buffer forward, discarding the frame we just parsed
          unparsedBuffer = unparsedBuffer.subarray(totalFrameLength);
        }
      });

      res.on("end", () => {
        console.log(`Docker closed log stream for ${this.containerName}`);
        this.stop();
      });
    });

    this.activeRequest.on("error", (e) => {
      console.error("Stream error:", e);
      this.window.webContents.send(
        "docker:log-stream-error",
        `Stream crashed: ${e.message}`,
      );
      this.stop();
    });

    this.activeRequest.end();
  }

  private queueLog(log: LogMessage) {
    this.logBuffer.push(log);
    // 4. Memory Safety: Flush immediately if velocity is extremely high
    if (this.logBuffer.length >= this.MAX_BATCH_SIZE) {
      this.flushLogs();
    }
  }

  private flushLogs() {
    if (this.logBuffer.length === 0) return;

    // Send a cloned batch over IPC, then instantly clear Node's memory buffer
    const batch = [...this.logBuffer];
    this.logBuffer = [];

    // // --- TEMPORARY RAW TERMINAL TEST ---
    // console.log(`\n[BACKEND BATCH FLUSH] Sending ${batch.length} logs to UI:`);
    // console.dir(batch, { depth: null, colors: true });
    // // -----------------------------------

    // Route to the React Frontend
    this.window.webContents.send("docker:stream-chunk", batch);
  }

  public stop() {
    if (this.flushIntervalId) clearInterval(this.flushIntervalId);
    if (this.activeRequest) this.activeRequest.destroy();

    // Flush any remaining logs before fully shutting down
    this.flushLogs();
    console.log(`Stopped monitoring ${this.containerName}`);
  }
}
