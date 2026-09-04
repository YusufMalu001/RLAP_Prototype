import { prisma } from "@rlap/db";
import type { NotificationChannel } from "@rlap/db";

export interface SendNotificationRequest {
  bookingId: string;
  channel: NotificationChannel;
  to: string;
  subject?: string;
  body: string;
}

export interface NotificationProvider {
  send(request: SendNotificationRequest): Promise<void>;
}

/**
 * Stands in for MSG91 (SMS), a transactional email provider, and the WhatsApp Business API
 * (§6.1) behind one interface. Logs the full message and persists a SentNotification row per
 * send so the (future) admin portal can show send history per booking.
 */
class MockNotificationProvider implements NotificationProvider {
  async send(request: SendNotificationRequest): Promise<void> {
    console.log(
      `[mock-notifications] ${request.channel} -> ${request.to} (booking ${request.bookingId})\n${request.body}`,
    );
    await prisma.sentNotification.create({
      data: {
        bookingId: request.bookingId,
        channel: request.channel,
        to: request.to,
        subject: request.subject,
        body: request.body,
      },
    });
  }
}

export const notificationProvider: NotificationProvider = new MockNotificationProvider();
