import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../lib/asyncHandler";
import { mergeOcrIntoCart } from "../cart/ocrMergeService";

export const ocrRouter = Router();

// Memory storage: the mock never reads file bytes (see integrations/ocr.ts), only the
// filename, so there's nothing to persist to disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

ocrRouter.post(
  "/orgs/:orgSlug/ocr/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const cartToken = req.body?.cartToken;
    if (typeof cartToken !== "string" || cartToken.trim().length === 0) {
      res.status(400).json({ error: "cartToken is required" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }
    res.json(await mergeOcrIntoCart(cartToken, req.file.originalname));
  }),
);
