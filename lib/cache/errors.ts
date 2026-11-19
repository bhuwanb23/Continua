import { DataIntegrityError } from "@/lib/errors";

export class CacheIntegrityError extends DataIntegrityError {}

export class CacheVersionMismatchError extends CacheIntegrityError {}

export class CacheSchemaError extends CacheIntegrityError {}

export class CacheReferenceError extends CacheIntegrityError {}

export class CacheHashError extends CacheIntegrityError {}

export function cacheError(code: string, message: string, cause?: unknown): CacheIntegrityError {
  return new CacheIntegrityError(`${code}: ${message}`, cause ? { cause } : undefined);
}
