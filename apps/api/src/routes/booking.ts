import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { getBookingDetail, payForBooking } from "../booking/bookingService";

export const bookingRouter = Router();

bookingRouter.post(
  "/:bookingId/pay",
  asyncHandler(async (req, res) => {
    const forceFail = req.body?.forceFail === true;
    const result = await payForBooking(req.params.bookingId!, { forceFail });
    res.status(result.success ? 200 : 402).json(result);
  }),
);

bookingRouter.get(
  "/:bookingId",
  asyncHandler(async (req, res) => {
    res.json(await getBookingDetail(req.params.bookingId!));
  }),
);
