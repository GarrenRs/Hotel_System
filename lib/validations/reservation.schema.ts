import { z } from 'zod';

export const reservationFormSchema = z.object({
  customerName: z.string().min(2, { message: 'validation.nameRequired' }),
  phone: z.string().min(8, { message: 'validation.phoneRequired' }),
  email: z.string().email({ message: 'validation.emailInvalid' }),
  arrivalDate: z.string().min(1, { message: 'validation.arrivalRequired' }),
  departureDate: z.string().min(1, { message: 'validation.departureRequired' }),
  guests: z.coerce.number().min(1, { message: 'validation.guestsMin' }).max(10, { message: 'validation.guestsMax' }),
  roomType: z.string().min(1, { message: 'validation.roomRequired' }),
  roomId: z.string().min(1, { message: 'validation.roomIdRequired' }),
  notes: z.string().optional(),
});

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export const adminLoginSchema = z.object({
  username: z.string().min(1, { message: 'validation.usernameRequired' }),
  password: z.string().min(1, { message: 'validation.passwordRequired' }),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;
