import { randomUUID } from "crypto";

export interface PaymentChargeRequest {
  amount: number;
  currency?: string;
  /** Test hook: force a decline regardless of amount. */
  forceFail?: boolean;
}

export interface PaymentChargeResult {
  success: boolean;
  transactionId: string;
  failureReason?: string;
}

export interface PaymentProvider {
  charge(request: PaymentChargeRequest): Promise<PaymentChargeResult>;
}

/**
 * Simulates a payment gateway round-trip (Razorpay is the named provider in §6.1). A charge
 * whose amount ends in .13 always declines — a deliberate, easy-to-hit test hook for the
 * failure path (§3.9/§5.8: "payment failure always returns the patient to the payment step").
 */
class MockPaymentProvider implements PaymentProvider {
  constructor(private readonly delayMs: number = 400) {}

  async charge(request: PaymentChargeRequest): Promise<PaymentChargeResult> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    const centsRemainder = Math.round(request.amount * 100) % 100;
    const endsInThirteen = centsRemainder === 13;

    if (request.forceFail || endsInThirteen) {
      return {
        success: false,
        transactionId: `mock_txn_${randomUUID()}`,
        failureReason: request.forceFail
          ? "Forced failure (forceFail flag)"
          : "Payment declined (mock .13 failure hook)",
      };
    }

    return { success: true, transactionId: `mock_txn_${randomUUID()}` };
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
