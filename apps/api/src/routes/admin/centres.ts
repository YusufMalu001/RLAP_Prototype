import { Router } from "express";
import { prisma } from "@rlap/db";
import { asyncHandler } from "../../lib/asyncHandler";
import { HttpError } from "../../lib/httpError";

export const adminCentresRouter = Router();

function toCentreDto(centre: {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  lat: number | null;
  lng: number | null;
  offersRadiology: boolean;
  offersLab: boolean;
}) {
  return centre;
}

adminCentresRouter.get(
  "/centres",
  asyncHandler(async (req, res) => {
    const centres = await prisma.centre.findMany({
      where: { organizationId: req.adminUser!.organizationId },
      orderBy: { name: "asc" },
    });
    res.json({ centres: centres.map(toCentreDto) });
  }),
);

adminCentresRouter.get(
  "/centres/:id",
  asyncHandler(async (req, res) => {
    const centre = await prisma.centre.findFirst({
      where: { id: req.params.id, organizationId: req.adminUser!.organizationId },
    });
    if (!centre) throw new HttpError(404, "Centre not found");
    res.json({ centre: toCentreDto(centre) });
  }),
);

adminCentresRouter.post(
  "/centres",
  asyncHandler(async (req, res) => {
    const b = req.body ?? {};
    if (
      typeof b.name !== "string" ||
      !b.name.trim() ||
      typeof b.address !== "string" ||
      typeof b.city !== "string" ||
      typeof b.area !== "string"
    ) {
      throw new HttpError(400, "name, address, city and area are required");
    }
    const centre = await prisma.centre.create({
      data: {
        organizationId: req.adminUser!.organizationId,
        name: b.name.trim(),
        address: b.address.trim(),
        city: b.city.trim(),
        area: b.area.trim(),
        lat: typeof b.lat === "number" ? b.lat : null,
        lng: typeof b.lng === "number" ? b.lng : null,
        offersRadiology: Boolean(b.offersRadiology),
        offersLab: Boolean(b.offersLab),
      },
    });
    res.status(201).json({ centre: toCentreDto(centre) });
  }),
);

adminCentresRouter.patch(
  "/centres/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const existing = await prisma.centre.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!existing) throw new HttpError(404, "Centre not found");

    const b = req.body ?? {};
    const centre = await prisma.centre.update({
      where: { id: existing.id },
      data: {
        name: typeof b.name === "string" ? b.name.trim() : undefined,
        address: typeof b.address === "string" ? b.address.trim() : undefined,
        city: typeof b.city === "string" ? b.city.trim() : undefined,
        area: typeof b.area === "string" ? b.area.trim() : undefined,
        lat: b.lat === undefined ? undefined : b.lat === null ? null : Number(b.lat),
        lng: b.lng === undefined ? undefined : b.lng === null ? null : Number(b.lng),
        offersRadiology: typeof b.offersRadiology === "boolean" ? b.offersRadiology : undefined,
        offersLab: typeof b.offersLab === "boolean" ? b.offersLab : undefined,
      },
    });
    res.json({ centre: toCentreDto(centre) });
  }),
);

adminCentresRouter.delete(
  "/centres/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const existing = await prisma.centre.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!existing) throw new HttpError(404, "Centre not found");

    const bookingCount = await prisma.booking.count({ where: { centreId: existing.id } });
    if (bookingCount > 0) {
      throw new HttpError(409, "Cannot delete — this centre has existing bookings");
    }
    await prisma.$transaction([
      prisma.centreRadiologyExam.deleteMany({ where: { centreId: existing.id } }),
      prisma.centreLabTest.deleteMany({ where: { centreId: existing.id } }),
      prisma.serviceableArea.deleteMany({ where: { centreId: existing.id } }),
      prisma.slot.deleteMany({ where: { centreId: existing.id } }),
      prisma.centre.delete({ where: { id: existing.id } }),
    ]);
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// Serviceable areas (home-collection PIN codes) — scoped to a centre.
// ---------------------------------------------------------------------------

adminCentresRouter.get(
  "/centres/:centreId/serviceable-areas",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const centre = await prisma.centre.findFirst({
      where: { id: req.params.centreId, organizationId },
    });
    if (!centre) throw new HttpError(404, "Centre not found");
    const areas = await prisma.serviceableArea.findMany({
      where: { centreId: centre.id },
      orderBy: { pinCode: "asc" },
    });
    res.json({
      areas: areas.map((a) => ({ ...a, homeCollectionCharge: Number(a.homeCollectionCharge) })),
    });
  }),
);

adminCentresRouter.post(
  "/centres/:centreId/serviceable-areas",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const centre = await prisma.centre.findFirst({
      where: { id: req.params.centreId, organizationId },
    });
    if (!centre) throw new HttpError(404, "Centre not found");

    const b = req.body ?? {};
    if (typeof b.pinCode !== "string" || !/^\d{6}$/.test(b.pinCode)) {
      throw new HttpError(400, "pinCode must be a 6-digit string");
    }
    if (typeof b.homeCollectionCharge !== "number") {
      throw new HttpError(400, "homeCollectionCharge is required");
    }
    const area = await prisma.serviceableArea.create({
      data: {
        organizationId,
        centreId: centre.id,
        pinCode: b.pinCode,
        homeCollectionCharge: b.homeCollectionCharge,
        isActive: b.isActive !== false,
      },
    });
    res
      .status(201)
      .json({ area: { ...area, homeCollectionCharge: Number(area.homeCollectionCharge) } });
  }),
);

adminCentresRouter.patch(
  "/serviceable-areas/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const existing = await prisma.serviceableArea.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!existing) throw new HttpError(404, "Serviceable area not found");

    const b = req.body ?? {};
    if (b.pinCode !== undefined && !/^\d{6}$/.test(b.pinCode)) {
      throw new HttpError(400, "pinCode must be a 6-digit string");
    }
    const area = await prisma.serviceableArea.update({
      where: { id: existing.id },
      data: {
        pinCode: typeof b.pinCode === "string" ? b.pinCode : undefined,
        homeCollectionCharge:
          typeof b.homeCollectionCharge === "number" ? b.homeCollectionCharge : undefined,
        isActive: typeof b.isActive === "boolean" ? b.isActive : undefined,
      },
    });
    res.json({ area: { ...area, homeCollectionCharge: Number(area.homeCollectionCharge) } });
  }),
);

adminCentresRouter.delete(
  "/serviceable-areas/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const existing = await prisma.serviceableArea.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!existing) throw new HttpError(404, "Serviceable area not found");
    await prisma.serviceableArea.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);
