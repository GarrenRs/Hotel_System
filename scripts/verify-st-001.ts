/* eslint-disable no-console */
/**
 * Tier 1 verification for the ST-001/ST-002 phase (run against a live dev
 * server). Covers: the full reservation lifecycle state machine, every illegal
 * transition (§16), concurrent double-booking protection, the shared offer
 * rule via /api/rooms/available, maintenance warnings, and key regressions.
 *
 * Requires the server on BASE_URL and the same admin credentials/JWT secret
 * that were used to start it (ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET env).
 * A pristine `npx tsx prisma/seed.ts` must be run immediately before the
 * server starts so date-relative assertions are deterministic.
 */

import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const ADMIN_USERNAME = requiredEnv('ADMIN_USERNAME');
const ADMIN_PASSWORD = requiredEnv('ADMIN_PASSWORD');

let adminToken: string | null = null;

interface Response {
  status: number;
  body: unknown;
}

async function request(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth !== false && adminToken) headers.Cookie = `hotel_admin_token=${adminToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (typeof res.headers.getSetCookie === 'function') {
    const setCookies = res.headers.getSetCookie();
    const tokenCookie = setCookies.find((cookie) => cookie.startsWith('hotel_admin_token='));
    if (tokenCookie) {
      adminToken = tokenCookie.split(';')[0].split('=')[1];
    }
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

function isoToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysFromNow(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const today = isoToday();

const results: Array<{ name: string; pass: boolean; detail?: string }> = [];

function check(name: string, pass: boolean, detail = ''): void {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `   [${detail}]` : ''}`);
}

function body<T>(res: Response): T {
  return res.body as T;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  errors?: string[];
}

interface RoomEntity {
  id: string;
  roomNumber: string;
  roomType: string;
  status: string;
  currentGuestName?: string | null;
}

interface ReservationEntity {
  id: string;
  reservationId: string;
  status: string;
  roomId: string | null;
  roomNumber?: string | null;
}

interface AdminStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  todayDepartures: number;
  currentGuests: Array<{ guestName: string; roomNumber: string }>;
}

async function loginAdmin(): Promise<void> {
  const res = await request('/api/admin/login', { method: 'POST', body: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD }, auth: false });
  const ok = res.status === 200 && body<ApiEnvelope<unknown>>(res).success === true;
  check('admin login sets auth token', ok, `status=${res.status}`);
}

async function getRooms(): Promise<RoomEntity[]> {
  const res = await request('/api/rooms', { auth: false });
  const list = body<ApiEnvelope<RoomEntity[]>>(res);
  assert.ok(list.success && Array.isArray(list.data), 'GET /api/rooms failed');
  return list.data as RoomEntity[];
}

async function roomByNumber(number: string): Promise<RoomEntity> {
  const rooms = await getRooms();
  const room = rooms.find((r) => r.roomNumber === number);
  assert.ok(room, `room ${number} not found`);
  return room;
}

async function createReservation(input: {
  roomId: string;
  roomType: string;
  arrivalDate: string;
  departureDate: string;
  guests: number;
}): Promise<Response> {
  return request('/api/reservations', {
    method: 'POST',
    auth: false,
    body: {
      customerName: 'Verify Guest',
      phone: '+213 551 001 001',
      email: 'verify@example.dz',
      ...input,
    },
  });
}

async function availableRooms(arrivalDate: string, departureDate: string, roomType: string): Promise<RoomEntity[]> {
  const res = await request(`/api/rooms/available?arrival=${arrivalDate}&departure=${departureDate}&roomType=${roomType}`, { auth: false });
  const list = body<ApiEnvelope<RoomEntity[]>>(res);
  assert.ok(list.success && Array.isArray(list.data), 'GET /api/rooms/available failed');
  return list.data as RoomEntity[];
}

async function main(): Promise<void> {
  await loginAdmin();

  // ---------------------------------------------------------------
  // Regression: seeded inventory + dashboard invariants
  // ---------------------------------------------------------------
  const rooms = await getRooms();
  check('GET /api/rooms returns 13 rooms', rooms.length === 13, `count=${rooms.length}`);

  const room101 = rooms.find((r) => r.roomNumber === '101');
  check('room 101 shows current guest (OCCUPIED)', room101?.currentGuestName === 'Fatima Al-Hassan', room101?.currentGuestName ?? 'none');

  const statsRes = await request('/api/admin/stats');
  const stats = body<ApiEnvelope<AdminStats>>(statsRes);
  check('admin stats totalRooms=13', stats.data?.totalRooms === 13, `total=${stats.data?.totalRooms}`);
  check('admin stats occupied=2 / cleaning=1 / maintenance=1', stats.data?.occupiedRooms === 2 && stats.data?.cleaningRooms === 1 && stats.data?.maintenanceRooms === 1,
    `occ=${stats.data?.occupiedRooms} clean=${stats.data?.cleaningRooms} maint=${stats.data?.maintenanceRooms}`);
  check('admin stats currentGuests=2 with todayDepartures=1', stats.data?.currentGuests.length === 2 && stats.data?.todayDepartures === 1,
    `guests=${stats.data?.currentGuests.length} departures=${stats.data?.todayDepartures}`);

  // Unauthenticated admin API must be rejected.
  const unauth = await request('/api/admin/stats', { auth: false });
  check('admin API rejects unauthenticated caller', unauth.status === 401, `status=${unauth.status}`);

  // ---------------------------------------------------------------
  // Booking happy path + failures
  // ---------------------------------------------------------------
  const room103 = await roomByNumber('103');
  const futureArrival = daysFromNow(10);
  const futureDeparture = daysFromNow(13);

  const created = await createReservation({
    roomId: room103.id,
    roomType: room103.roomType,
    arrivalDate: futureArrival,
    departureDate: futureDeparture,
    guests: 2,
  });
  const createdId = body<ApiEnvelope<ReservationEntity>>(created).data?.id;
  check('booking creates NEW reservation with roomNumber', created.status === 201 && !!createdId, `status=${created.status}`);
  const createdData = body<ApiEnvelope<ReservationEntity>>(created).data;
  check('booking response includes roomNumber 103', createdData?.roomNumber === '103', createdData?.roomNumber ?? 'none');

  const duplicate = await createReservation({
    roomId: room103.id,
    roomType: room103.roomType,
    arrivalDate: futureArrival,
    departureDate: futureDeparture,
    guests: 2,
  });
  check('duplicate booking same room/period rejected (400 errors.roomNotAvailable)', duplicate.status === 400 && body<ApiEnvelope<null>>(duplicate).errors?.[0] === 'errors.roomNotAvailable',
    `status=${duplicate.status} key=${body<ApiEnvelope<null>>(duplicate).errors?.[0]}`);

  const room401 = await roomByNumber('401');
  const capacity = await createReservation({
    roomId: room401.id,
    roomType: room401.roomType,
    arrivalDate: futureArrival,
    departureDate: futureDeparture,
    guests: 6,
  });
  check('over-capacity booking rejected (400 validation.guestsCapacity)', capacity.status === 400 && body<ApiEnvelope<null>>(capacity).errors?.[0] === 'validation.guestsCapacity',
    `status=${capacity.status} key=${body<ApiEnvelope<null>>(capacity).errors?.[0]}`);

  const roomTypeMismatch = await request('/api/reservations', {
    method: 'POST',
    auth: false,
    body: {
      customerName: 'Mismatch Guest',
      phone: '+213 551 001 002',
      email: 'mismatch@example.dz',
      roomId: room401.id,
      roomType: 'STANDARD_DOUBLE',
      arrivalDate: futureArrival,
      departureDate: futureDeparture,
      guests: 2,
    },
  });
  check('room/type mismatch rejected (400 errors.roomTypeMismatch)', roomTypeMismatch.status === 400 && body<ApiEnvelope<null>>(roomTypeMismatch).errors?.[0] === 'errors.roomTypeMismatch',
    `status=${roomTypeMismatch.status}`);

  // ---------------------------------------------------------------
  // Shared offer rule via /api/rooms/available
  // ---------------------------------------------------------------
  const sameDay = await availableRooms(today, daysFromNow(3), 'STANDARD_DOUBLE');
  check('same-day availability excludes OCCUPIED 101', !sameDay.some((r) => r.roomNumber === '101'));
  check('same-day availability excludes CLEANING 203', !sameDay.some((r) => r.roomNumber === '203'));
  check('same-day availability includes AVAILABLE 103', sameDay.some((r) => r.roomNumber === '103'));

  const blockedFamily = await availableRooms(daysFromNow(1), daysFromNow(4), 'FAMILY_SUITE');
  check('future availability honours conflicting CONFIRMED (401 excluded)', blockedFamily.length === 0, `count=${blockedFamily.length}`);

  const freeFamily = await availableRooms(daysFromNow(9), daysFromNow(12), 'FAMILY_SUITE');
  check('future availability returns 401 once its period is free', freeFamily.length === 1 && freeFamily[0].roomNumber === '401',
    `rooms=${freeFamily.map((r) => r.roomNumber).join(',')}`);
  check('MAINTENANCE room 402 never offered', !freeFamily.some((r) => r.roomNumber === '402'));

  const badRange = await request(`/api/rooms/available?arrival=${daysFromNow(5)}&departure=${daysFromNow(3)}`, { auth: false });
  check('availability endpoint rejects departure<=arrival (400)', badRange.status === 400, `status=${badRange.status}`);

  // ---------------------------------------------------------------
  // Reservation lifecycle transitions
  // ---------------------------------------------------------------
  const confirmRes = await request(`/api/reservations/${createdId}`, { method: 'PATCH', body: { status: 'CONFIRMED' } });
  const confirmedStatus = body<ApiEnvelope<ReservationEntity>>(confirmRes).data?.status;
  check('NEW -> CONFIRMED allowed', confirmRes.status === 200 && confirmedStatus === 'CONFIRMED', `status=${confirmedStatus}`);

  const room201 = await roomByNumber('201');
  const beforeArrival = await createReservation({
    roomId: room201.id,
    roomType: room201.roomType,
    arrivalDate: daysFromNow(5),
    departureDate: daysFromNow(8),
    guests: 1,
  });
  const beforeArrivalId = body<ApiEnvelope<ReservationEntity>>(beforeArrival).data?.id;
  await request(`/api/reservations/${beforeArrivalId}`, { method: 'PATCH', body: { status: 'CONFIRMED' } });
  const earlyCheckIn = await request(`/api/reservations/${beforeArrivalId}`, { method: 'PATCH', body: { status: 'CHECKED_IN' } });
  check('CONFIRMED -> CHECKED_IN before arrival rejected (400 admin.errors.checkInBeforeArrival)',
    earlyCheckIn.status === 400 && body<ApiEnvelope<null>>(earlyCheckIn).errors?.[0] === 'admin.errors.checkInBeforeArrival',
    `status=${earlyCheckIn.status} key=${body<ApiEnvelope<null>>(earlyCheckIn).errors?.[0]}`);

  const room303 = await roomByNumber('303');
  const maintenanceTarget = await createReservation({
    roomId: room303.id,
    roomType: room303.roomType,
    arrivalDate: today,
    departureDate: daysFromNow(3),
    guests: 2,
  });
  const maintenanceTargetId = body<ApiEnvelope<ReservationEntity>>(maintenanceTarget).data?.id;
  const maintenanceTargetRef = body<ApiEnvelope<ReservationEntity>>(maintenanceTarget).data?.reservationId;
  const confirmToday = await request(`/api/reservations/${maintenanceTargetId}`, { method: 'PATCH', body: { status: 'CONFIRMED' } });
  check('today-arrival CONFIRMED allowed on AVAILABLE room', confirmToday.status === 200 && body<ApiEnvelope<ReservationEntity>>(confirmToday).data?.status === 'CONFIRMED',
    `status=${confirmToday.status}`);

  const maintenanceRes = await request(`/api/rooms/${room303.id}`, { method: 'PATCH', body: { status: 'MAINTENANCE' } });
  const maintenanceData = body<ApiEnvelope<{ room: RoomEntity; warnings: Array<{ reservationId: string }> }>>(maintenanceRes);
  check('AVAILABLE -> MAINTENANCE allowed with warning for the CONFIRMED stay',
    maintenanceRes.status === 200 && maintenanceData.data?.room.status === 'MAINTENANCE' && maintenanceData.data?.warnings?.some((w) => w.reservationId === maintenanceTargetRef) === true,
    `warnings=[${maintenanceData.data?.warnings?.map((w) => w.reservationId).join(',')}]`);

  const checkInOnMaintenance = await request(`/api/reservations/${maintenanceTargetId}`, { method: 'PATCH', body: { status: 'CHECKED_IN' } });
  check('CHECKED_IN rejected on a MAINTENANCE room (400 admin.errors.checkInRoomNotReady)',
    checkInOnMaintenance.status === 400 && body<ApiEnvelope<null>>(checkInOnMaintenance).errors?.[0] === 'admin.errors.checkInRoomNotReady',
    `status=${checkInOnMaintenance.status} key=${body<ApiEnvelope<null>>(checkInOnMaintenance).errors?.[0]}`);

  const room102 = await roomByNumber('102');
  const noCheckIn = await createReservation({
    roomId: room102.id,
    roomType: room102.roomType,
    arrivalDate: today,
    departureDate: daysFromNow(2),
    guests: 2,
  });
  const noCheckInId = body<ApiEnvelope<ReservationEntity>>(noCheckIn).data?.id;
  await request(`/api/reservations/${noCheckInId}`, { method: 'PATCH', body: { status: 'CONFIRMED' } });
  const checkoutWithoutCheckIn = await request(`/api/reservations/${noCheckInId}`, { method: 'PATCH', body: { status: 'CHECKED_OUT' } });
  check('CHECKED_OUT without CHECKED_IN rejected (400 admin.errors.invalidTransition)',
    checkoutWithoutCheckIn.status === 400 && body<ApiEnvelope<null>>(checkoutWithoutCheckIn).errors?.[0] === 'admin.errors.invalidTransition',
    `status=${checkoutWithoutCheckIn.status}`);

  const checkedInList = await request('/api/reservations?status=CHECKED_IN');
  const fatima = body<ApiEnvelope<ReservationEntity[]>>(checkedInList).data?.find((r) => r.status === 'CHECKED_IN') ?? null;
  if (fatima) {
    const cancelInHouse = await request(`/api/reservations/${fatima.id}`, { method: 'PATCH', body: { status: 'CANCELLED' } });
    check('CHECKED_IN -> CANCELLED rejected (400 admin.errors.invalidTransition)',
      cancelInHouse.status === 400 && body<ApiEnvelope<null>>(cancelInHouse).errors?.[0] === 'admin.errors.invalidTransition',
      `status=${cancelInHouse.status}`);
  } else {
    check('CHECKED_IN -> CANCELLED rejected', false, 'no CHECKED_IN row found');
  }

  const room202 = await roomByNumber('202');
  const cancelled = await createReservation({
    roomId: room202.id,
    roomType: room202.roomType,
    arrivalDate: today,
    departureDate: daysFromNow(2),
    guests: 1,
  });
  const cancelledId = body<ApiEnvelope<ReservationEntity>>(cancelled).data?.id;
  await request(`/api/reservations/${cancelledId}`, { method: 'PATCH', body: { status: 'CANCELLED' } });
  const revive = await request(`/api/reservations/${cancelledId}`, { method: 'PATCH', body: { status: 'CONFIRMED' } });
  check('CANCELLED -> CONFIRMED rejected (400 admin.errors.invalidTransition)',
    revive.status === 400 && body<ApiEnvelope<null>>(revive).errors?.[0] === 'admin.errors.invalidTransition',
    `status=${revive.status}`);

  // ---------------------------------------------------------------
  // Concurrency: 15 parallel bookings for the same room/period
  // ---------------------------------------------------------------
  const concurrentRoom = await roomByNumber('103');
  const payloads = Array.from({ length: 15 }, () => ({
    customerName: 'Race Guest',
    phone: '+213 551 009 000',
    email: 'race@example.dz',
    roomId: concurrentRoom.id,
    roomType: concurrentRoom.roomType,
    arrivalDate: daysFromNow(3),
    departureDate: daysFromNow(6),
    guests: 2,
  }));

  const racing = await Promise.all(
    payloads.map((p) =>
      fetch(`${BASE}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
    )
  );
  const statuses = await Promise.all(racing.map((r) => r.status));
  const successes = statuses.filter((s) => s === 201).length;
  const rejected = statuses.filter((s) => s === 400).length;
  check('15 parallel bookings => exactly 1 succeeds, 14 rejected', successes === 1 && rejected === 14,
    `201s=${successes} 400s=${rejected} (${statuses.join(',')})`);

  // ---------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------
  const failures = results.filter((r) => !r.pass).length;
  console.log(`\n===== VERIFICATION SUMMARY: ${results.length - failures}/${results.length} passed =====`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Verification run crashed:', err);
  process.exitCode = 2;
});