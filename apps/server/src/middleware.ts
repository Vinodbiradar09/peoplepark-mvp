import "dotenv/config";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";

export async function AuthHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    console.log("session", session);
    if (!session || !session.user || !session.session) {
      return res.status(401).json({
        error: "Invalid session , Authentication Required",
        success: false,
      });
    }
    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.log("error in auth handler ", error);
    return res.status(401).json({
      error: "Invalid or expired session",
      success: false,
    });
  }
}
