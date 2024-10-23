import { getDateTime } from "./format";

describe("birthday module", () => {
  describe("format library", () => {
    test("getDateTime with UTC timezone", () => {
      const tested = new Date("2024-10-23T00:00:00.000Z");
      const expected = new Date("2024-10-23T00:00:00.000Z");
      expect(getDateTime(tested, null).toJSDate().toISOString()).toBe(expected.toISOString());
    });

    test("getDateTime with Australia/Adelaide timezone", () => {
      // test based on production failure where a birthday returned 22 years instead of 23
      const tested = new Date("2001-10-24T00:00:00.000Z");
      const expected = new Date("2001-10-23T13:30:00.000Z");
      expect(getDateTime(tested, "Australia/Adelaide").toJSDate().toISOString()).toBe(expected.toISOString());
    });
  });
});
