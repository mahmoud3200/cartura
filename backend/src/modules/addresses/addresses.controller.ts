import type { RequestHandler } from "express";

import {
  getAuthenticatedUserId,
} from "../../shared/utils/request.utils.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import { mapAddress } from "./addresses.mapper.js";
import {
  addressIdParamsSchema,
  createAddressRequestSchema,
  updateAddressRequestSchema,
} from "./addresses.schemas.js";
import { addressesService } from "./addresses.service.js";

export class AddressesController {
  list: RequestHandler = async (req, res, next) => {
    try {
      const addresses = await addressesService.list(
        getAuthenticatedUserId(req),
      );
      res.status(200).json({ data: addresses.map(mapAddress) });
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(createAddressRequestSchema, req.body);
      const address = await addressesService.create(
        getAuthenticatedUserId(req),
        body,
      );
      res.status(201).json({ data: mapAddress(address) });
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      const { addressId } = parseInput(addressIdParamsSchema, req.params);
      const address = await addressesService.getById(
        getAuthenticatedUserId(req),
        addressId,
      );
      res.status(200).json({ data: mapAddress(address) });
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const { addressId } = parseInput(addressIdParamsSchema, req.params);
      const body = parseInput(updateAddressRequestSchema, req.body);
      const address = await addressesService.update(
        getAuthenticatedUserId(req),
        addressId,
        body,
      );
      res.status(200).json({ data: mapAddress(address) });
    } catch (error) {
      next(error);
    }
  };

  setDefault: RequestHandler = async (req, res, next) => {
    try {
      const { addressId } = parseInput(addressIdParamsSchema, req.params);
      const address = await addressesService.setDefault(
        getAuthenticatedUserId(req),
        addressId,
      );
      res.status(200).json({ data: mapAddress(address) });
    } catch (error) {
      next(error);
    }
  };

  delete: RequestHandler = async (req, res, next) => {
    try {
      const { addressId } = parseInput(addressIdParamsSchema, req.params);
      await addressesService.delete(
        getAuthenticatedUserId(req),
        addressId,
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const addressesController = new AddressesController();
