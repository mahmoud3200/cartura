import type {
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@cartura/contracts/addresses";

import {
  addressLimitExceededError,
  addressNotFoundError,
} from "./addresses.errors.js";
import {
  addressesRepository,
  type AddressesRepository,
} from "./addresses.repository.js";

const maxAddressesPerUser = 20;

export class AddressesService {
  constructor(
    private readonly repository: AddressesRepository = addressesRepository,
  ) {}

  list(userId: string) {
    return this.repository.listByUserId(userId);
  }

  async getById(userId: string, addressId: string) {
    const address = await this.repository.findByIdForUser(userId, addressId);

    if (!address) {
      throw addressNotFoundError();
    }

    return address;
  }

  async create(userId: string, input: CreateAddressRequest) {
    const addressCount = await this.repository.countByUserId(userId);

    if (addressCount >= maxAddressesPerUser) {
      throw addressLimitExceededError();
    }

    const isDefault = addressCount === 0 || input.isDefault === true;

    return this.repository.create(userId, input, isDefault);
  }

  async update(
    userId: string,
    addressId: string,
    input: UpdateAddressRequest,
  ) {
    const address = await this.repository.update(userId, addressId, input);

    if (!address) {
      throw addressNotFoundError();
    }

    return address;
  }

  async setDefault(userId: string, addressId: string) {
    const address = await this.repository.setDefault(userId, addressId);

    if (!address) {
      throw addressNotFoundError();
    }

    return address;
  }

  async delete(userId: string, addressId: string) {
    const address = await this.repository.delete(userId, addressId);

    if (!address) {
      throw addressNotFoundError();
    }
  }
}

export const addressesService = new AddressesService();
