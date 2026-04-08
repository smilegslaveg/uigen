import { test, expect, describe, beforeEach } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

// jsdom provides sessionStorage on globalThis
beforeEach(() => {
  sessionStorage.clear();
});

describe("setHasAnonWork", () => {
  test("saves work when messages exist", () => {
    const messages = [{ role: "user", content: "hello" }];
    const fileSystemData = { "/": { type: "directory" } };
    setHasAnonWork(messages, fileSystemData);
    expect(getHasAnonWork()).toBe(true);
  });

  test("saves work when file system has more than root entry", () => {
    setHasAnonWork([], {
      "/": { type: "directory" },
      "/App.jsx": { type: "file", content: "code" },
    });
    expect(getHasAnonWork()).toBe(true);
  });

  test("does not save when messages are empty and only root entry exists", () => {
    setHasAnonWork([], { "/": { type: "directory" } });
    expect(getHasAnonWork()).toBe(false);
  });

  test("does not save when messages are empty and file system is empty", () => {
    setHasAnonWork([], {});
    expect(getHasAnonWork()).toBe(false);
  });

  test("persists messages and file system data", () => {
    const messages = [{ role: "user", content: "create a button" }];
    const fileSystemData = { "/App.jsx": "code" };
    setHasAnonWork(messages, fileSystemData);
    const data = getAnonWorkData();
    expect(data?.messages).toEqual(messages);
    expect(data?.fileSystemData).toEqual(fileSystemData);
  });

  test("overwrites previous data on repeated calls", () => {
    setHasAnonWork([{ role: "user", content: "first" }], {});
    setHasAnonWork(
      [{ role: "user", content: "second" }],
      { "/App.jsx": "code" }
    );
    const data = getAnonWorkData();
    expect(data?.messages[0].content).toBe("second");
  });
});

describe("getHasAnonWork", () => {
  test("returns false when nothing is stored", () => {
    expect(getHasAnonWork()).toBe(false);
  });

  test("returns true after work is saved", () => {
    setHasAnonWork([{ role: "user", content: "hello" }], {});
    expect(getHasAnonWork()).toBe(true);
  });

  test("returns false after work is cleared", () => {
    setHasAnonWork([{ role: "user", content: "hello" }], {});
    clearAnonWork();
    expect(getHasAnonWork()).toBe(false);
  });
});

describe("getAnonWorkData", () => {
  test("returns null when nothing is stored", () => {
    expect(getAnonWorkData()).toBeNull();
  });

  test("returns the stored messages and file system data", () => {
    const messages = [{ role: "assistant", content: "Here is your component" }];
    const fileSystemData = { "/App.jsx": "export default function App() {}" };
    setHasAnonWork(messages, fileSystemData);

    const result = getAnonWorkData();
    expect(result).not.toBeNull();
    expect(result?.messages).toEqual(messages);
    expect(result?.fileSystemData).toEqual(fileSystemData);
  });

  test("returns null when stored data is invalid JSON", () => {
    sessionStorage.setItem("uigen_anon_data", "{ not valid json");
    expect(getAnonWorkData()).toBeNull();
  });

  test("returns null when data key is missing but flag key is present", () => {
    sessionStorage.setItem("uigen_has_anon_work", "true");
    // DATA_KEY not set
    expect(getAnonWorkData()).toBeNull();
  });
});

describe("clearAnonWork", () => {
  test("removes stored flag and data", () => {
    setHasAnonWork([{ role: "user", content: "hello" }], {
      "/App.jsx": "code",
    });
    clearAnonWork();
    expect(getHasAnonWork()).toBe(false);
    expect(getAnonWorkData()).toBeNull();
  });

  test("is safe to call when nothing is stored", () => {
    expect(() => clearAnonWork()).not.toThrow();
  });

  test("does not affect unrelated sessionStorage keys", () => {
    sessionStorage.setItem("other_key", "other_value");
    setHasAnonWork([{ role: "user", content: "hello" }], {});
    clearAnonWork();
    expect(sessionStorage.getItem("other_key")).toBe("other_value");
  });
});
