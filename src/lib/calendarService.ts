import { getGraphConfig } from "./env"
import { graphRequest } from "./graphClient"

const SLOT_MINUTES = 30
const WORK_START_HOUR = 8
const WORK_END_HOUR = 18

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function toIsoLocalDateTime(date: string, time: string) {
  return `${date}T${time}:00`
}

function normalizeIsoLocal(input: string) {
  return String(input).trim().slice(0, 19)
}

function isoLocalToMs(isoLocal: string) {
  const [datePart, timePart] = isoLocal.split("T")
  if (!datePart || !timePart) return NaN
  const [y, m, d] = datePart.split("-").map(Number)
  const [hh, mm] = timePart.split(":").map(Number)
  if ([y, m, d, hh, mm].some(Number.isNaN)) return NaN
  return new Date(Date.UTC(y, m - 1, d, hh, mm, 0)).getTime()
}

function msToIsoLocal(ms: number) {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function addMinutesToIsoLocal(isoLocal: string, minutes: number) {
  const baseMs = isoLocalToMs(isoLocal)
  return msToIsoLocal(baseMs + minutes * 60 * 1000)
}

function isSlotWithinWorkingHours(startIso: string, endIso: string) {
  const start = normalizeIsoLocal(startIso)
  const end = normalizeIsoLocal(endIso)

  const [startDate] = start.split("T")
  const [endDate] = end.split("T")
  if (startDate !== endDate) return false

  const [startHour, startMinute] = start.split("T")[1].split(":").map(Number)
  const [endHour, endMinute] = end.split("T")[1].split(":").map(Number)
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute

  return startTotal >= WORK_START_HOUR * 60 && endTotal <= WORK_END_HOUR * 60
}

interface BusyRange {
  start: string
  end: string
  status: string
  source: string
  subject?: string
}

function mergeBusyRanges(ranges: BusyRange[]) {
  const normalized = ranges
    .map((r) => ({
      start: normalizeIsoLocal(r.start),
      end: normalizeIsoLocal(r.end),
      status: r.status || "busy",
      source: r.source || "unknown",
    }))
    .filter((r) => r.start < r.end)
    .sort((a, b) => a.start.localeCompare(b.start))

  if (normalized.length === 0) return []

  const merged = [normalized[0]]
  for (let i = 1; i < normalized.length; i++) {
    const prev = merged[merged.length - 1]
    const cur = normalized[i]
    if (cur.start <= prev.end) {
      if (cur.end > prev.end) prev.end = cur.end
      prev.status = prev.status === "busy" ? prev.status : cur.status
    } else {
      merged.push(cur)
    }
  }

  return merged.map((r) => ({
    start: r.start,
    end: r.end,
    status: r.status,
    source: r.source,
  }))
}

function busyFromScheduleItems(schedule: any) {
  return (schedule?.scheduleItems || [])
    .filter((it: any) => it?.start?.dateTime && it?.end?.dateTime)
    .filter((it: any) => (it.status || "").toLowerCase() !== "free")
    .map((it: any) => ({
      start: it.start.dateTime,
      end: it.end.dateTime,
      status: it.status || "busy",
      subject: it.subject || "",
      source: "scheduleItems",
    }))
}

function busyFromAvailabilityView(schedule: any, startIso: string) {
  const view = String(schedule?.availabilityView || "")
  if (!view) return []
  const start = normalizeIsoLocal(startIso)

  const ranges: BusyRange[] = []
  let i = 0
  while (i < view.length) {
    if (view[i] === "0") {
      i += 1
      continue
    }

    const startIndex = i
    while (i < view.length && view[i] !== "0") i += 1

    const rangeStart = addMinutesToIsoLocal(start, startIndex * SLOT_MINUTES)
    const rangeEnd = addMinutesToIsoLocal(start, i * SLOT_MINUTES)
    ranges.push({
      start: rangeStart,
      end: rangeEnd,
      status: "busy",
      source: "availabilityView",
    })
  }

  return ranges
}

export async function getScheduleForRange(startIso: string, endIso: string) {
  const { encargadoEmail } = getGraphConfig()
  const normalizedStart = normalizeIsoLocal(startIso)
  const normalizedEnd = normalizeIsoLocal(endIso)

  const payload = {
    schedules: [encargadoEmail],
    startTime: { dateTime: normalizedStart, timeZone: "America/Bogota" },
    endTime: { dateTime: normalizedEnd, timeZone: "America/Bogota" },
    availabilityViewInterval: SLOT_MINUTES,
  }

  const data = await graphRequest(`/users/${encodeURIComponent(encargadoEmail)}/calendar/getSchedule`, {
    method: "POST",
    body: JSON.stringify(payload),
  })

  const schedule = data?.value?.[0] || {}
  const busy = mergeBusyRanges([
    ...busyFromScheduleItems(schedule),
    ...busyFromAvailabilityView(schedule, normalizedStart),
  ])

  const available = buildAvailableSlots(normalizedStart, normalizedEnd, schedule, busy)
  return { encargadoEmail, busy, available }
}

function buildAvailableSlots(startIso: string, endIso: string, schedule: any, busyRanges: BusyRange[]) {
  const availabilityView = String(schedule?.availabilityView || "")
  const rangeStartMs = isoLocalToMs(startIso)
  const rangeEndMs = isoLocalToMs(endIso)
  if (Number.isNaN(rangeStartMs) || Number.isNaN(rangeEndMs)) return []

  const available: { start: string; end: string }[] = []
  const totalSlots = Math.floor((rangeEndMs - rangeStartMs) / (SLOT_MINUTES * 60 * 1000))

  for (let index = 0; index < totalSlots; index++) {
    const slotStartMs = rangeStartMs + index * SLOT_MINUTES * 60 * 1000
    const slotEndMs = slotStartMs + SLOT_MINUTES * 60 * 1000

    const slotStart = msToIsoLocal(slotStartMs)
    const slotEnd = msToIsoLocal(slotEndMs)

    const viewState = availabilityView[index] || "0"
    if (viewState !== "0") continue

    if (!isSlotWithinWorkingHours(slotStart, slotEnd)) continue

    const overlapsBusy = busyRanges.some((b) => slotStart < b.end && slotEnd > b.start)
    if (!overlapsBusy) {
      available.push({ start: slotStart, end: slotEnd })
    }
  }

  return available
}

async function verifyAvailability(startIso: string, endIso: string) {
  const normalizedStart = normalizeIsoLocal(startIso)
  const normalizedEnd = normalizeIsoLocal(endIso)
  const { busy } = await getScheduleForRange(normalizedStart, normalizedEnd)
  return !busy.some((b) => normalizedStart < b.end && normalizedEnd > b.start)
}

export async function createAppointment({
  nombre,
  correo,
  fecha,
  hora,
  duracionMinutos,
}: {
  nombre: string
  correo: string
  fecha: string
  hora: string
  duracionMinutos: number
}) {
  const { encargadoEmail } = getGraphConfig()

  const startIso = toIsoLocalDateTime(fecha, hora)
  const endIso = addMinutesToIsoLocal(startIso, duracionMinutos)

  const isFree = await verifyAvailability(startIso, endIso)
  if (!isFree) {
    const error = new Error("El horario seleccionado ya no está disponible.")
    ;(error as any).code = "SLOT_TAKEN"
    throw error
  }

  const eventPayload = {
    subject: `People Cuidado - ${nombre}`,
    body: {
      contentType: "HTML",
      content: `Cita agendada desde Portal PEOPLE.<br/>Nombre: ${nombre}<br/>Correo: ${correo}`,
    },
    start: {
      dateTime: startIso,
      timeZone: "America/Bogota",
    },
    end: {
      dateTime: endIso,
      timeZone: "America/Bogota",
    },
    attendees: [
      {
        emailAddress: { address: correo, name: nombre },
        type: "required",
      },
    ],
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  }

  const event = await graphRequest(`/users/${encodeURIComponent(encargadoEmail)}/events`, {
    method: "POST",
    body: JSON.stringify(eventPayload),
  })

  return {
    eventId: event.id,
    teamsMeetingUrl: event?.onlineMeeting?.joinUrl || event?.onlineMeetingUrl || "",
    fecha,
    hora,
  }
}
