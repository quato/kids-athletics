import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, serverError } from "../_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const expectedPassword = process.env.ORGANIZER_PASSWORD;
  if (!expectedPassword) {
    return serverError(res, new Error("ORGANIZER_PASSWORD is not configured"));
  }

  const { password } = req.body as { password?: string };
  if (!password || typeof password !== "string") {
    return json(res, 400, { error: "Password is required" });
  }

  if (password !== expectedPassword) {
    return json(res, 401, { error: "Невірний пароль" });
  }

  return json(res, 200, { ok: true });
}
