import { apiPost } from "./api";

interface CheckoutResponse {
  url: string;
}

export async function createCheckoutSession(
  tipsterId: string,
  type: "DAY_PASS" | "MONTHLY",
  email?: string
): Promise<string> {
  const body: Record<string, string> = { tipsterId, type };
  if (email) body.email = email;
  const data = await apiPost<CheckoutResponse>("/checkout/create-session", body);
  return data.url;
}

export async function createTipsterCheckout(
  pseudo: string,
  bio: string,
  sports: string[]
): Promise<string> {
  const data = await apiPost<CheckoutResponse>("/checkout/become-tipster", {
    pseudo,
    bio: bio || undefined,
    sports,
  });
  return data.url;
}
