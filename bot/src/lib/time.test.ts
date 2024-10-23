import { yearsAgo } from "./time";

describe("time library", () => {
  test("yearsAgo with UTC timezone", () => {
    const tested = new Date("2001-10-23T00:00:00.000Z");
    const present = new Date("2024-10-23T00:00:00.000Z");
    expect(yearsAgo(tested, "utc", present)).toBe(23);
  });

  test("yearsAgo with Europe/Prague timezone 2001-2024", () => {
    const tested = new Date("2001-10-23T00:00:00.000Z");
    const present = new Date("2024-10-22T22:00:00.000Z");
    expect(yearsAgo(tested, "Europe/Prague", present)).toBe(23);
  });

  test("yearsAgo with Australia/Adelaide timezone 2001-2024", () => {
    const tested = new Date("2001-10-24T00:00:00.000Z");
    const present = new Date("2024-10-23T13:30:00.000Z");
    expect(yearsAgo(tested, "Australia/Adelaide", present)).toBe(23);
  });
});
