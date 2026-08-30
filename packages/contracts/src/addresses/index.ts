import { z } from "zod";

import { dataListResponseSchema, dataResponseSchema } from "../common/index.js";

const textSchema = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

const phoneNumberSchema = z
  .string()
  .trim()
  .min(5)
  .max(30)
  .regex(/^[+\d\s().-]+$/, "Phone number contains invalid characters");

const postalCodeSchema = z
  .string()
  .trim()
  .max(30)
  .regex(/^\d*$/, "Postal code must contain numbers only");

export const createAddressRequestSchema = z
  .object({
    addressName: textSchema(2, 80),
    recipientName: textSchema(2, 120),
    phoneNumber: phoneNumberSchema,
    country: textSchema(2, 80),
    city: textSchema(2, 80),
    area: textSchema(1, 120),
    streetAddress: textSchema(5, 250),
    postalCode: postalCodeSchema
      .transform((value) => (value.length === 0 ? undefined : value))
      .optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const updateAddressRequestSchema = z
  .object({
    addressName: textSchema(2, 80).optional(),
    recipientName: textSchema(2, 120).optional(),
    phoneNumber: phoneNumberSchema.optional(),
    country: textSchema(2, 80).optional(),
    city: textSchema(2, 80).optional(),
    area: textSchema(1, 120).optional(),
    streetAddress: textSchema(5, 250).optional(),
    postalCode: postalCodeSchema
      .transform((value) => (value.length === 0 ? null : value))
      .nullable()
      .optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required",
  });

export const addressResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  addressName: z.string(),
  recipientName: z.string(),
  phoneNumber: z.string(),
  country: z.string(),
  city: z.string(),
  area: z.string(),
  streetAddress: z.string(),
  postalCode: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const addressIdParamsSchema = z
  .object({ addressId: z.uuid() })
  .strict();

export const addressDataResponseSchema = dataResponseSchema(addressResponseSchema);
export const addressListResponseSchema = dataListResponseSchema(addressResponseSchema);

export type CreateAddressRequest = z.infer<typeof createAddressRequestSchema>;
export type UpdateAddressRequest = z.infer<typeof updateAddressRequestSchema>;
export type AddressResponse = z.infer<typeof addressResponseSchema>;
export type AddressDataResponse = z.infer<typeof addressDataResponseSchema>;
export type AddressListResponse = z.infer<typeof addressListResponseSchema>;
