import * as http from "node:http";
import * as os from "node:os";

const DOCKER_SOCKET =
  os.platform() === "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock";

/**
 * A native, dependency-free client to communicate with the Docker Daemon API
 * via Unix Domain Sockets / Windows Named Pipes.
 */
export class DockerClient {
  private static makeRequest<T>(
    path: string,
    method: "GET" | "POST" = "GET",
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        socketPath: DOCKER_SOCKET,
        path,
        method,
        headers: {
          Host: "http",
          Accept: "application/json",
          Connection: "close",
        },
      };

      const req = http.request(options, (res) => {
        let rawData = "";

        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(rawData));
            } catch (e) {
              reject(new Error(`Failed to parse Docker response: ${e}`));
            }
          } else {
            reject(
              new Error(`Docker API Error: [${res.statusCode}] ${rawData}`),
            );
          }
        });
      });

      req.on("error", (e) => {
        reject(new Error(`Socket Connection Error: ${e.message}`));
      });

      // CRITICAL FIX: Add a timeout so the UI never hangs infinitely
      req.setTimeout(3000, () => {
        req.destroy(); // Forcefully kill the socket
        reject(new Error("Docker API Request timed out."));
      });

      req.end();
    });
  }

  /**
   * Fetches the list of currently running Docker containers.
   *
   * Queries the Docker daemon for running containers and returns an array of
   * container names with any leading slash removed.
   *
   * @returns Promise<string[]> A promise that resolves with the names of
   * running containers.
   * @throws Error if the Docker API request fails or the response cannot be parsed.
   */
  public static async getRunningContainers(): Promise<string[]> {
    try {
      const containers = await this.makeRequest<any[]>(
        "/containers/json?status=running",
      );

      return containers.map((container) =>
        container.Names[0].replace(/^\//, ""),
      );
    } catch (error) {
      console.error("Error fetching running containers:", error);
      throw error;
    }
  }
}
