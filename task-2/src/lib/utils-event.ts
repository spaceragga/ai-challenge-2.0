export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `item-${Date.now()}`;
}

export function genTicketCode(): string {
  return Array.from({ length: 8 }, () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]
  ).join("");
}

export function isPast(end_at: string): boolean {
  return new Date(end_at).getTime() < Date.now();
}

export function fmtDate(iso: string, tz?: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium", timeStyle: "short", timeZone: tz || undefined,
    });
  } catch { return new Date(iso).toLocaleString(); }
}

export function buildICS(opts: {
  uid: string; title: string; description?: string; start: string; end: string; location?: string;
}): string {
  const dt = (s: string) => new Date(s).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//EventPass//EN","BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(opts.start)}`,`DTEND:${dt(opts.end)}`,
    `SUMMARY:${opts.title.replace(/\n/g, " ")}`,
    opts.description ? `DESCRIPTION:${opts.description.replace(/\n/g, "\\n")}` : "",
    opts.location ? `LOCATION:${opts.location.replace(/\n/g, " ")}` : "",
    "END:VEVENT","END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

export function downloadFile(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
