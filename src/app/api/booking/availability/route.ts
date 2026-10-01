import { NextResponse } from "next/server";
import { availableSlots } from "@/lib/availability";
import { getService } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  const serviceId = Number(url.searchParams.get("serviceId"));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }

  const service = Number.isFinite(serviceId) ? getService(serviceId) : undefined;
  const duration = service?.duration_min ?? 60;

  const result = availableSlots(date, duration, {
    track: service?.track ?? "hair",
  });

  return NextResponse.json({
    date,
    duration,
    durationLabel: service?.duration_min ?? duration,
    ...result,
  });
}
