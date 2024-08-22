// sum.test.js
import { expect, test, describe } from "vitest";
import { isMessageEvent } from "../utils";

describe("The isMessageEvent", () => {
  test("should properly identify message event type.", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let e: any = "";
    expect(isMessageEvent(e)).toBeFalsy();

    e = {};
    expect(isMessageEvent(e)).toBeFalsy();

    e = null;
    expect(isMessageEvent(e)).toBeFalsy();

    e = undefined;
    expect(isMessageEvent(e)).toBeFalsy();

    e = new Event("Message");
    expect(isMessageEvent(e)).toBeFalsy();

    e = new MessageEvent("message");
    expect(isMessageEvent(e)).toBeTruthy();
  });
});
