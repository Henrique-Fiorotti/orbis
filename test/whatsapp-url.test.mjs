import test from "node:test"
import assert from "node:assert/strict"

import { getWhatsappUrl } from "../lib/whatsapp-url.mjs"

test("getWhatsappUrl monta link do WhatsApp", () => {
  assert.equal(getWhatsappUrl("(11) 91234-5678"), "https://wa.me/5511912345678")
})
