import { NextResponse } from "next/server";
import { setPerformanceStatus, withPerformanceTrace } from "@/lib/performance";
import { ForbiddenError, requirePermission, UnauthorizedError } from "@/modules/auth/permissions";
import { searchProductsForPos } from "@/modules/sales/pos.service";

export async function GET(request: Request) {
  return withPerformanceTrace({ route: "/api/pos/search", method: "GET" }, async () => {
    try {
      await requirePermission("pos.access", { onDenied: "throw" });
      const query = new URL(request.url).searchParams.get("q") ?? "";
      if (query.length > 200) {
        setPerformanceStatus(400);
        return NextResponse.json({ error: "Search is too long." }, { status: 400 });
      }
      return NextResponse.json(await searchProductsForPos(query), {
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        const status = error instanceof UnauthorizedError ? 401 : 403;
        setPerformanceStatus(status);
        return NextResponse.json({ error: "Access denied." }, { status });
      }
      throw error;
    }
  });
}
