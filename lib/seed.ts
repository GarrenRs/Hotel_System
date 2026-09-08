import { prisma } from '@/lib/prisma';
import { RoomType, ReservationStatus } from '@/domain/reservation/enums';

interface ReservationSeed {
  customerName: string;
  phone: string;
  email: string;
  arrivalDate: string;
  departureDate: string;
  guests: number;
  roomType: RoomType;
  status: ReservationStatus;
  notes: string;
  roomNumber?: string;
}

function isoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Seeds a fresh set of realistic rooms and reservations for the single-tenant
 * hotel database. All stay dates are computed relative to `new Date()` so the
 * dashboard always shows a believable mix of past, current, and upcoming
 * stays regardless of when the seed runs.
 *
 * This is a manual, CLI-only seeding tool (run via `npx prisma db seed`) used
 * to give a new installation a realistic starting dataset. It is NOT exposed
 * through any HTTP route. Any existing rooms/reservations are replaced; do not
 * run it against a database that already holds real guest data.
 */
export async function seedDatabase(): Promise<void> {
  await prisma.reservation.deleteMany();
  await prisma.room.deleteMany();

  const now = new Date();
  const daysFromNow = (offset: number): Date => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    return date;
  };
  const stayDate = (offset: number): string => isoDateLocal(daysFromNow(offset));

  const roomDefs: Array<{ roomNumber: string; roomType: RoomType; status: string }> = [
    { roomNumber: '101', roomType: RoomType.STANDARD_DOUBLE, status: 'OCCUPIED' },
    { roomNumber: '102', roomType: RoomType.STANDARD_DOUBLE, status: 'AVAILABLE' },
    { roomNumber: '103', roomType: RoomType.STANDARD_DOUBLE, status: 'AVAILABLE' },
    { roomNumber: '104', roomType: RoomType.STANDARD_DOUBLE, status: 'AVAILABLE' },
    { roomNumber: '201', roomType: RoomType.STANDARD_DOUBLE, status: 'AVAILABLE' },
    { roomNumber: '202', roomType: RoomType.DELUXE_SUITE, status: 'AVAILABLE' },
    { roomNumber: '203', roomType: RoomType.DELUXE_SUITE, status: 'CLEANING' },
    { roomNumber: '301', roomType: RoomType.DELUXE_SUITE, status: 'AVAILABLE' },
    { roomNumber: '302', roomType: RoomType.EXECUTIVE_SUITE, status: 'OCCUPIED' },
    { roomNumber: '303', roomType: RoomType.EXECUTIVE_SUITE, status: 'AVAILABLE' },
    { roomNumber: '401', roomType: RoomType.FAMILY_SUITE, status: 'AVAILABLE' },
    { roomNumber: '402', roomType: RoomType.FAMILY_SUITE, status: 'MAINTENANCE' },
    { roomNumber: '501', roomType: RoomType.ROYAL_SUITE, status: 'AVAILABLE' },
  ];

  await prisma.room.createMany({
    data: roomDefs.map((def) => ({
      roomNumber: def.roomNumber,
      roomType: def.roomType,
      status: def.status,
    })),
  });

  const createdRooms = await prisma.room.findMany({
    select: { id: true, roomNumber: true },
  });

  const roomsById: Record<string, string> = {};
  createdRooms.forEach((room) => {
    roomsById[room.roomNumber] = room.id;
  });

  const existingReservationIds = new Set(
    (await prisma.reservation.findMany({ select: { reservationId: true } })).map((r) => r.reservationId)
  );
  const takeUniqueReservationIds = (count: number): string[] => {
    const ids: string[] = [];
    while (ids.length < count) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const candidate = `NP-2026-${suffix}`;
      if (!ids.includes(candidate) && !existingReservationIds.has(candidate)) {
        ids.push(candidate);
        existingReservationIds.add(candidate);
      }
    }
    return ids;
  };

  const reservationDefs: ReservationSeed[] = [
    {
      customerName: 'Elena Vasquez',
      phone: '+34 612 345 678',
      email: 'elena.vasquez@example.com',
      arrivalDate: stayDate(-14),
      departureDate: stayDate(-10),
      guests: 2,
      roomType: RoomType.STANDARD_DOUBLE,
      status: ReservationStatus.CONFIRMED,
      notes: 'Checked in after 23:00. Late arrival handled at the front desk.',
      roomNumber: '101',
    },
    {
      customerName: 'James Mitchell',
      phone: '+44 7911 123456',
      email: 'james.mitchell@example.com',
      arrivalDate: stayDate(-7),
      departureDate: stayDate(-4),
      guests: 1,
      roomType: RoomType.FAMILY_SUITE,
      status: ReservationStatus.CONFIRMED,
      notes: 'Conference rate — requested an early last-morning checkout.',
      roomNumber: '401',
    },
    {
      customerName: 'Fatima Al-Hassan',
      phone: '+971 50 123 4567',
      email: 'fatima.alhassan@example.com',
      arrivalDate: stayDate(-2),
      departureDate: stayDate(3),
      guests: 3,
      roomType: RoomType.STANDARD_DOUBLE,
      status: ReservationStatus.CONFIRMED,
      notes: 'Anniversary stay. Champagne and fruit platter set up in the room.',
      roomNumber: '101',
    },
    {
      customerName: 'Kenji Tanaka',
      phone: '+81 90 1234 5678',
      email: 'kenji.tanaka@example.com',
      arrivalDate: stayDate(-1),
      departureDate: stayDate(5),
      guests: 2,
      roomType: RoomType.EXECUTIVE_SUITE,
      status: ReservationStatus.CONFIRMED,
      notes: 'Quiet room preferred, away from the elevator bank.',
      roomNumber: '302',
    },
    {
      customerName: "Sarah O'Brien",
      phone: '+1 212 555 1234',
      email: "sarah.obrien@example.com",
      arrivalDate: stayDate(5),
      departureDate: stayDate(8),
      guests: 4,
      roomType: RoomType.FAMILY_SUITE,
      status: ReservationStatus.CONFIRMED,
      notes: 'Family stay — one extra bed required for the children.',
      roomNumber: '401',
    },
    {
      customerName: 'Carlos Mendez',
      phone: '+52 155 1234 5678',
      email: 'carlos.mendez@example.com',
      arrivalDate: stayDate(10),
      departureDate: stayDate(14),
      guests: 2,
      roomType: RoomType.ROYAL_SUITE,
      status: ReservationStatus.CONFIRMED,
      notes: 'Business stay — access to the executive lounge requested.',
      roomNumber: '501',
    },
    {
      customerName: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya.sharma@example.com',
      arrivalDate: stayDate(7),
      departureDate: stayDate(10),
      guests: 2,
      roomType: RoomType.STANDARD_DOUBLE,
      status: ReservationStatus.PENDING,
      notes: 'Awaiting payment confirmation. Vegetarian breakfast requested.',
      roomNumber: '102',
    },
    {
      customerName: 'Lucas Dubois',
      phone: '+33 6 12 34 56 78',
      email: 'lucas.dubois@example.com',
      arrivalDate: stayDate(2),
      departureDate: stayDate(5),
      guests: 1,
      roomType: RoomType.DELUXE_SUITE,
      status: ReservationStatus.CANCELLED,
      notes: 'Cancelled by guest — change in travel plans.',
      roomNumber: '202',
    },
  ];

  const reservationIds = takeUniqueReservationIds(reservationDefs.length);

  await prisma.reservation.createMany({
    data: reservationDefs.map((def, index) => {
      const { roomNumber, ...rest } = def;
      return {
        reservationId: reservationIds[index],
        roomId: roomNumber ? roomsById[roomNumber] : undefined,
        ...rest,
      };
    }),
  });
}