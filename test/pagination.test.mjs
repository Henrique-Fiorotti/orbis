import test from "node:test"
import assert from "node:assert/strict"

import { collectPaginatedItems, getSafeTotalPages } from "../lib/pagination.mjs"

test("getSafeTotalPages normaliza valores invalidos e arredonda paginas", () => {
  assert.equal(getSafeTotalPages(2.2), 3)
  assert.equal(getSafeTotalPages(0, 4), 1)
  assert.equal(getSafeTotalPages("abc", 2), 1)
  assert.equal(getSafeTotalPages(undefined, 2), 2)
})

test("collectPaginatedItems coleta paginas ate totalPages", async () => {
  const visitedPages = []
  const result = await collectPaginatedItems({
    pageSize: 2,
    fetchPage: async (page, pageSize) => {
      visitedPages.push({ page, pageSize })
      return {
        items: [`item-${page}`],
        totalPages: 3,
      }
    },
    getItems: (payload) => payload.items,
  })

  assert.deepEqual(result, {
    items: ["item-1", "item-2", "item-3"],
    totalPages: 3,
  })
  assert.deepEqual(visitedPages, [
    { page: 1, pageSize: 2 },
    { page: 2, pageSize: 2 },
    { page: 3, pageSize: 2 },
  ])
})

test("collectPaginatedItems respeita maxPages", async () => {
  const result = await collectPaginatedItems({
    maxPages: 2,
    fetchPage: async (page) => ({
      items: [page],
      totalPages: 5,
    }),
    getItems: (payload) => payload.items,
  })

  assert.deepEqual(result, {
    items: [1, 2],
    totalPages: 5,
  })
})
