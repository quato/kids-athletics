import type { VercelRequest, VercelResponse } from "@vercel/node";

export type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

export function json(res: VercelResponse, statusCode: number, body: unknown): void {
  res.status(statusCode).json(body);
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]): void {
  res.setHeader("Allow", allowed.join(", "));
  json(res, 405, { error: "Method Not Allowed" });
}

export function badRequest(res: VercelResponse, message: string): void {
  json(res, 400, { error: message });
}

export function notFound(res: VercelResponse, message = "Not found"): void {
  json(res, 404, { error: message });
}

export function serverError(res: VercelResponse, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[server error]", error);
  json(res, 500, { error: "Internal server error", detail: message });
}
