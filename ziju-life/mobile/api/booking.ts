import { apiFetch } from "./client";

export interface MeetingType {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

export interface BookingSlot {
  id: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

export async function getMeetingTypes(): Promise<{
  meetingTypes: MeetingType[];
}> {
  return apiFetch("/api/settings/meeting-types");
}

export async function getSlots(params: {
  from: string;
  to: string;
  meetingType?: string;
}): Promise<{ slots: BookingSlot[] }> {
  const sp = new URLSearchParams();
  sp.set("from", params.from);
  sp.set("to", params.to);
  if (params.meetingType) sp.set("meetingType", params.meetingType);
  return apiFetch(`/api/booking/slots?${sp.toString()}`);
}

export async function reserve(data: {
  slotId: string;
  name: string;
  email: string;
  note?: string;
  meetingType: string;
}): Promise<{ ok: boolean; bookingId?: string; paymentUrl?: string }> {
  return apiFetch("/api/booking/reserve", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
