import { z } from 'zod';
import { isoToday } from '@/services/availability';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const reservationFormSchema = z
  .object({
    customerName: z.string().min(2, { message: 'validation.nameRequired' }),
    phone: z.string().min(8, { message: 'validation.phoneRequired' }),
    email: z.union([z.literal(''), z.string().email({ message: 'validation.emailInvalid' })]).optional(),
    arrivalDate: z
      .string()
      .min(1, { message: 'validation.arrivalRequired' })
      .regex(ISO_DATE_PATTERN, { message: 'validation.invalidDateFormat' }),
    departureDate: z
      .string()
      .min(1, { message: 'validation.departureRequired' })
      .regex(ISO_DATE_PATTERN, { message: 'validation.invalidDateFormat' }),
    guests: z.coerce.number().min(1, { message: 'validation.guestsMin' }).max(10, { message: 'validation.guestsMax' }),
    roomType: z.string().min(1, { message: 'validation.roomRequired' }),
    roomId: z.string().min(1, { message: 'validation.roomIdRequired' }),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.arrivalDate >= data.departureDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['departureDate'],
        message: 'validation.departureAfterArrival',
      });
    }

    if (data.arrivalDate < isoToday()) {
      ctx.addIssue({
        code: 'custom',
        path: ['arrivalDate'],
        message: 'validation.arrivalPast',
      });
    }
  });

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export const adminLoginSchema = z.object({
  username: z.string().min(1, { message: 'validation.usernameRequired' }),
  password: z.string().min(1, { message: 'validation.passwordRequired' }),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;