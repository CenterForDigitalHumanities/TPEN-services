/**
 * Single source of truth for the RERUM page id: RERUMIDPREFIX + last path segment.
 * Ids already carrying RERUMIDPREFIX are returned unchanged.
 * Dependency-free on purpose so it can be imported anywhere without circular imports.
 * @param {String} id A Page id (bare, UUID, URI or already a RERUM id)
 * @returns {String}
 */
export const toRerumPageId = (id) => id.startsWith(process.env.RERUMIDPREFIX)
   ? id
   : `${process.env.RERUMIDPREFIX}${id.split("/").pop()}`
