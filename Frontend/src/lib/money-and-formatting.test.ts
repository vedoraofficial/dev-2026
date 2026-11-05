import { describe, expect, it } from "vitest"

import { formatINR, formatSignedINR } from "./format"
import { paiseToRupees, rupeesToPaise } from "./money"

describe("Money and Currency Formatting", () => {
  it("Scenario 10: formatINR formats integer rupees cleanly without decimal trailing zeros", () => {
    expect(formatINR(100)).toBe("₹100")
    expect(formatINR(1000)).toBe("₹1,000")
    expect(formatINR(500000)).toBe("₹5,00,000")
    expect(formatINR(0)).toBe("₹0")
  })

  it("Scenario 11: formatINR preserves exactly two decimal places for fractional amounts", () => {
    expect(formatINR(99.75)).toBe("₹99.75")
    expect(formatINR(100.5)).toBe("₹100.50")
    expect(formatINR(0.25)).toBe("₹0.25")
    expect(formatINR(0.5)).toBe("₹0.50")
  })

  it("Scenario 12: formatINR handles negative amounts and invalid numbers safely", () => {
    expect(formatINR(-500)).toBe("-₹500")
    expect(formatINR(-500.75)).toBe("-₹500.75")
    expect(formatINR(NaN)).toBe("₹0")
    expect(formatINR(Infinity)).toBe("₹0")
  })

  it("Scenario 13: formatSignedINR correctly prepends + for positive and - for negative", () => {
    expect(formatSignedINR(250)).toBe("+₹250")
    expect(formatSignedINR(250.5)).toBe("+₹250.50")
    expect(formatSignedINR(-100)).toBe("-₹100")
    expect(formatSignedINR(-100.25)).toBe("-₹100.25")
    expect(formatSignedINR(0)).toBe("₹0")
  })

  it("Scenario 14: paiseToRupees and rupeesToPaise conversions are exact", () => {
    expect(paiseToRupees(10000)).toBe(100) // ₹100
    expect(paiseToRupees(50000000)).toBe(500000) // ₹5,00,000
    expect(paiseToRupees(9995)).toBe(99.95)
    expect(paiseToRupees(null)).toBe(0)
    expect(paiseToRupees(undefined)).toBe(0)

    expect(rupeesToPaise(100)).toBe(10000)
    expect(rupeesToPaise(500000)).toBe(50000000)
    expect(rupeesToPaise(99.95)).toBe(9995)
  })
})
