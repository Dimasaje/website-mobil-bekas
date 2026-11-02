import { db, schema } from "db";
import { and, asc, eq, max } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";
import { imageProcessor } from "../services/image-processor";

export const adminPhotosRouter = new Hono();

adminPhotosRouter.use("*", requireAdminAuth);

// POST /api/admin/cars/:carId/photos - Upload foto ke mobil
adminPhotosRouter.post("/:carId/photos", async (c) => {
  const carId = c.req.param("carId");

  const [car] = await db
    .select({ id: schema.cars.id })
    .from(schema.cars)
    .where(eq(schema.cars.id, carId))
    .limit(1);

  if (!car) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Mobil tidak ditemukan",
        },
      },
      404,
    );
  }

  const body = await c.req.parseBody({ all: true });
  const rawFiles = body["file"] || body["files"];

  if (!rawFiles) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "File gambar wajib diunggah",
        },
      },
      400,
    );
  }

  const filesArray: File[] = Array.isArray(rawFiles)
    ? (rawFiles.filter((f) => f instanceof File) as File[])
    : rawFiles instanceof File
      ? [rawFiles]
      : [];

  if (filesArray.length === 0) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Format file tidak valid atau bukan berkas gambar",
        },
      },
      400,
    );
  }

  // Get current max order and count of existing photos
  const existingPhotos = await db
    .select({
      id: schema.carPhotos.id,
      order: schema.carPhotos.order,
      isPrimary: schema.carPhotos.isPrimary,
    })
    .from(schema.carPhotos)
    .where(eq(schema.carPhotos.carId, carId));

  let currentOrder =
    existingPhotos.length > 0
      ? Math.max(...existingPhotos.map((p) => p.order)) + 1
      : 0;
  const hasPrimary = existingPhotos.some((p) => p.isPrimary);

  const insertedPhotos = [];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const processed = await imageProcessor.processCarPhoto(
        carId,
        buffer,
        file.type,
      );

      const isPrimary = !hasPrimary && i === 0 && existingPhotos.length === 0;

      const [newPhoto] = await db
        .insert(schema.carPhotos)
        .values({
          id: processed.photoId,
          carId,
          url: processed.largeUrl,
          order: currentOrder++,
          isPrimary,
        })
        .returning();

      insertedPhotos.push({
        ...newPhoto,
        variants: {
          large: processed.largeUrl,
          medium: processed.mediumUrl,
          thumb: processed.thumbUrl,
        },
      });
    } catch (err) {
      return c.json(
        {
          success: false,
          error: {
            code: "UPLOAD_FAILED",
            message:
              err instanceof Error ? err.message : "Gagal memproses gambar",
          },
        },
        400,
      );
    }
  }

  return c.json(
    {
      success: true,
      message: `${insertedPhotos.length} foto berhasil diunggah`,
      data: insertedPhotos,
    },
    201,
  );
});

const reorderSchema = z.object({
  photos: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    }),
  ),
});

// PUT /api/admin/cars/:carId/photos/reorder - Atur urutan foto
adminPhotosRouter.put("/:carId/photos/reorder", async (c) => {
  const carId = c.req.param("carId");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = reorderSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Format data urutan tidak valid",
          details: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const { photos } = parseResult.data;

  for (const item of photos) {
    await db
      .update(schema.carPhotos)
      .set({ order: item.order })
      .where(
        and(
          eq(schema.carPhotos.id, item.id),
          eq(schema.carPhotos.carId, carId),
        ),
      );
  }

  const updatedPhotos = await db
    .select()
    .from(schema.carPhotos)
    .where(eq(schema.carPhotos.carId, carId))
    .orderBy(asc(schema.carPhotos.order));

  return c.json({
    success: true,
    message: "Urutan foto berhasil diperbarui",
    data: updatedPhotos,
  });
});

// PATCH /api/admin/cars/:carId/photos/:photoId/primary - Set foto utama
adminPhotosRouter.patch("/:carId/photos/:photoId/primary", async (c) => {
  const carId = c.req.param("carId");
  const photoId = c.req.param("photoId");

  const [targetPhoto] = await db
    .select()
    .from(schema.carPhotos)
    .where(
      and(eq(schema.carPhotos.id, photoId), eq(schema.carPhotos.carId, carId)),
    )
    .limit(1);

  if (!targetPhoto) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Foto tidak ditemukan pada mobil ini",
        },
      },
      404,
    );
  }

  // Set all photos of this car to false, and target to true
  await db
    .update(schema.carPhotos)
    .set({ isPrimary: false })
    .where(eq(schema.carPhotos.carId, carId));

  const [updated] = await db
    .update(schema.carPhotos)
    .set({ isPrimary: true })
    .where(eq(schema.carPhotos.id, photoId))
    .returning();

  return c.json({
    success: true,
    message: "Foto utama berhasil diubah",
    data: updated,
  });
});

// DELETE /api/admin/cars/:carId/photos/:photoId - Hapus foto
adminPhotosRouter.delete("/:carId/photos/:photoId", async (c) => {
  const carId = c.req.param("carId");
  const photoId = c.req.param("photoId");

  const [targetPhoto] = await db
    .select()
    .from(schema.carPhotos)
    .where(
      and(eq(schema.carPhotos.id, photoId), eq(schema.carPhotos.carId, carId)),
    )
    .limit(1);

  if (!targetPhoto) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Foto tidak ditemukan",
        },
      },
      404,
    );
  }

  // Delete physical files
  await imageProcessor.deleteCarPhotoFiles(targetPhoto.url);

  // Delete from database
  await db.delete(schema.carPhotos).where(eq(schema.carPhotos.id, photoId));

  // If deleted photo was primary, promote next photo if exists
  if (targetPhoto.isPrimary) {
    const [nextPhoto] = await db
      .select()
      .from(schema.carPhotos)
      .where(eq(schema.carPhotos.carId, carId))
      .orderBy(asc(schema.carPhotos.order))
      .limit(1);

    if (nextPhoto) {
      await db
        .update(schema.carPhotos)
        .set({ isPrimary: true })
        .where(eq(schema.carPhotos.id, nextPhoto.id));
    }
  }

  return c.json({
    success: true,
    message: "Foto berhasil dihapus",
  });
});
