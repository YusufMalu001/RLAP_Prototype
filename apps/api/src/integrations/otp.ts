/**
 * OTP transport. This interface is deliberately just "send a message to a mobile number" —
 * everything else (code generation, expiry, attempt tracking, verification) is owned by the
 * application (see cart/otpService-equivalent — apps/api/src/otp/otpService.ts), not by the
 * provider, because that's how transport-only providers like MSG91/Twilio SMS actually work.
 * Swapping this for a real SMS API means implementing OtpProvider against that API's
 * send-message call — nothing else in the app needs to change.
 */
export interface OtpProvider {
  send(mobileNumber: string, message: string): Promise<void>;
}

class MockOtpProvider implements OtpProvider {
  async send(mobileNumber: string, message: string): Promise<void> {
    console.log(`[mock-otp] -> ${mobileNumber}: ${message}`);
  }
}

export const otpProvider: OtpProvider = new MockOtpProvider();

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function buildOtpMessage(code: string): string {
  return `Your RLAP verification code is ${code}. It expires in 5 minutes.`;
}
