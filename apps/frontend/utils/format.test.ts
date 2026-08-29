import { formatMoney, percentOf } from "./format";

describe("formatMoney", () => {
  it("formats a positive number as whole-dollar USD currency", () => {
    expect(formatMoney(1234.56)).toBe("$1,235");
  });

  it("treats falsy input as zero", () => {
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(undefined as unknown as number)).toBe("$0");
    expect(formatMoney(NaN)).toBe("$0");
  });

  it("formats negative values", () => {
    expect(formatMoney(-500)).toBe("-$500");
  });
});

describe("percentOf", () => {
  it("returns 0% when total is zero to avoid dividing by zero", () => {
    expect(percentOf(5, 0)).toBe("0%");
  });

  it("rounds to the nearest whole percent", () => {
    expect(percentOf(1, 3)).toBe("33%");
    expect(percentOf(2, 3)).toBe("67%");
  });

  it("caps at 100% when value equals total", () => {
    expect(percentOf(10, 10)).toBe("100%");
  });
});
