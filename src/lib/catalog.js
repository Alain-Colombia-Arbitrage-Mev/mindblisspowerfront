import { unstable_cache } from "next/cache";

import { memberDb } from "@/lib/member-db";
import { createCatalogReader } from "./catalog-reader.mjs";
import { getCloudflareScope } from './cloudflare-runtime.mjs';

// Five-minute, tag-invalidated cache for non-personal definitions in Next.
// On Workers, reads remain scoped to the current request as before.
const catalog = createCatalogReader({ database: memberDb, requestScope: getCloudflareScope, cache: unstable_cache });

export const getCatalog = catalog.all;
export const getPackageCatalog = catalog.packages;
export const getRankCatalog = catalog.ranks;
export const invalidateCatalogLoad = catalog.invalidate;
