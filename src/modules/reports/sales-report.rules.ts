/** Revenue reports must never include HELD, VOIDED, draft, or unknown statuses. */
export function countsAsRevenue(status: string) {
  return status === "COMPLETED";
}
