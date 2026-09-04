import { Router } from "express";
import { prisma } from "@rlap/db";
import type { Centre } from "@rlap/db";
import { withOrg } from "../lib/withOrg";
import { haversineDistanceKm } from "../centres/matching";

export const centresRouter = Router();

function toCentreSummary(centre: Centre) {
  return {
    id: centre.id,
    name: centre.name,
    address: centre.address,
    city: centre.city,
    area: centre.area,
    offersRadiology: centre.offersRadiology,
    offersLab: centre.offersLab,
  };
}

centresRouter.post(
  "/orgs/:orgSlug/centres/nearby",
  withOrg(async (req, res, org) => {
    const { lat, lng, city, area } = req.body ?? {};
    const hasCoords = typeof lat === "number" && typeof lng === "number";
    const hasCityArea =
      typeof city === "string" &&
      city.trim().length > 0 &&
      typeof area === "string" &&
      area.trim().length > 0;

    if (!hasCoords && !hasCityArea) {
      res.status(400).json({ error: "Provide either { lat, lng } or { city, area }." });
      return;
    }

    const centres = await prisma.centre.findMany({ where: { organizationId: org.id } });

    if (hasCoords) {
      const withDistance = centres.map((centre) => ({
        ...toCentreSummary(centre),
        distanceKm:
          centre.lat !== null && centre.lng !== null
            ? Math.round(
                haversineDistanceKm({ lat, lng }, { lat: centre.lat, lng: centre.lng }) * 10,
              ) / 10
            : null,
      }));
      withDistance.sort((a, b) => {
        if (a.distanceKm === null) return b.distanceKm === null ? 0 : 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
      res.json({ centres: withDistance });
      return;
    }

    // City + area path: no coordinates supplied, so distance can't be computed — filter to
    // the city and surface exact-area matches first (§4.2 R5's manual location path).
    const cityLower = city.trim().toLowerCase();
    const areaLower = area.trim().toLowerCase();
    const inCity = centres
      .filter((centre) => centre.city.toLowerCase() === cityLower)
      .sort((a, b) => {
        const aExact = a.area.toLowerCase() === areaLower ? 0 : 1;
        const bExact = b.area.toLowerCase() === areaLower ? 0 : 1;
        return aExact !== bExact ? aExact - bExact : a.name.localeCompare(b.name);
      });

    res.json({
      centres: inCity.map((centre) => ({ ...toCentreSummary(centre), distanceKm: null })),
    });
  }),
);
