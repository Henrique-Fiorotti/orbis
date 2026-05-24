export function getSafeTotalPages(value, fallback = 1) {
  const pages = Number(value ?? fallback)
  return Number.isFinite(pages) && pages > 0 ? Math.ceil(pages) : 1
}

export async function collectPaginatedItems({
  fetchPage,
  getItems,
  pageSize = 10,
  maxPages = 100,
}) {
  const items = []
  let page = 1
  let totalPages = 1

  do {
    const payload = await fetchPage(page, pageSize)
    const pageItems = getItems(payload)

    if (Array.isArray(pageItems)) {
      items.push(...pageItems)
    }

    const totalFromPayload = Number(payload?.total)
    totalPages = getSafeTotalPages(
      payload?.totalPages,
      Number.isFinite(totalFromPayload) && pageSize > 0
        ? Math.ceil(totalFromPayload / pageSize)
        : totalPages
    )

    page += 1
  } while (page <= totalPages && page <= maxPages)

  return {
    items,
    totalPages,
  }
}
