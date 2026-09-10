import { NextResponse } from 'next/server';
import { ApiResponse } from '@/domain/reservation/types';
import {
  ReservationConflictError,
  ReservationNotFoundError,
  InvalidTransitionError,
  CheckInBeforeArrivalError,
  RoomNotReadyForCheckInError,
  RoomTypeMismatchError,
  CapacityExceededError,
  RoomNotFoundError as ReservationRoomNotFoundError,
} from '@/services/reservation/reservation.service';
import {
  RoomNotFoundError,
  InvalidRoomStatusError,
  RoomStatusLockedError,
} from '@/services/room/room.service';

type ErrorScope = 'guest' | 'admin';

function errorBody(status: number, key: string): NextResponse {
  const response: ApiResponse<null> = {
    success: false,
    message: key,
    data: null,
    errors: [key],
  };
  return NextResponse.json(response, { status });
}

/**
 * Maps service-level typed errors to a status code and an i18n message key.
 * The client translates the key via its locale; no presentation strings live
 * in the API layer. Unknown/unexpected errors become a generic 500.
 */
export function toErrorResponse(error: unknown, scope: ErrorScope): NextResponse {
  if (scope === 'guest') {
    if (error instanceof CapacityExceededError) {
      return errorBody(400, 'validation.guestsCapacity');
    }
    if (error instanceof ReservationConflictError) {
      return errorBody(400, 'errors.roomNotAvailable');
    }
    if (error instanceof RoomTypeMismatchError) {
      return errorBody(400, 'errors.roomTypeMismatch');
    }
    if (error instanceof ReservationRoomNotFoundError || error instanceof RoomNotFoundError) {
      return errorBody(404, 'errors.roomNotFound');
    }
  }

  if (error instanceof ReservationNotFoundError) {
    return errorBody(404, 'admin.errors.reservationNotFound');
  }
  if (error instanceof ReservationRoomNotFoundError || error instanceof RoomNotFoundError) {
    return errorBody(404, 'admin.errors.roomNotFound');
  }
  if (error instanceof InvalidTransitionError) {
    return errorBody(400, 'admin.errors.invalidTransition');
  }
  if (error instanceof CheckInBeforeArrivalError) {
    return errorBody(400, 'admin.errors.checkInBeforeArrival');
  }
  if (error instanceof RoomNotReadyForCheckInError) {
    return errorBody(400, 'admin.errors.checkInRoomNotReady');
  }
  if (error instanceof ReservationConflictError) {
    return errorBody(400, 'admin.errors.conflict');
  }
  if (error instanceof InvalidRoomStatusError) {
    return errorBody(400, 'admin.errors.invalidRoomStatus');
  }
  if (error instanceof RoomStatusLockedError) {
    return errorBody(400, 'admin.errors.invalidRoomTransition');
  }

  return errorBody(500, 'errors.serverError');
}