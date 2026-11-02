import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof z.ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validasi input gagal",
          details: err.issues,
        },
      },
      400,
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: "HTTP_ERROR",
          message: err.message,
        },
      },
      err.status,
    );
  }

  const isProd = process.env.NODE_ENV === "production";
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: isProd ? "Terjadi kesalahan pada server" : err.message,
      },
    },
    500,
  );
};

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Endpoint ${c.req.method} ${c.req.path} tidak ditemukan`,
      },
    },
    404,
  );
};
