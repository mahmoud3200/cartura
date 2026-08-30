export class StorageNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} storage is not configured`);
    this.name = "StorageNotConfiguredError";
  }
}
