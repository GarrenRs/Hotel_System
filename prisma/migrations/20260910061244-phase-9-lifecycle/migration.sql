-- Migration: phase-9 reservation lifecycle (ST-001 / ST-002)
-- 1. Room.roomNumber becomes UNIQUE (ST-001 decision: a room number identifies
--    one physical room; the public flow displays it to guests).
--    Verified pre-check: no duplicate roomNumber rows exist in the database.
-- 2. Legacy PENDING value is folded into NEW (ST-001 review decision 1: the
--    lifecycle is NEW -> CONFIRMED -> CHECKED_IN -> CHECKED_OUT | CANCELLED).

ALTER TABLE "Room" ADD CONSTRAINT "Room_roomNumber_key" UNIQUE ("roomNumber");

UPDATE "Reservation" SET "status" = 'NEW' WHERE "status" = 'PENDING';