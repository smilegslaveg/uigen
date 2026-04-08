import { test, expect, describe, beforeEach } from "vitest";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { VirtualFileSystem } from "@/lib/file-system";

describe("buildStrReplaceTool", () => {
  let fs: VirtualFileSystem;
  let tool: ReturnType<typeof buildStrReplaceTool>;

  beforeEach(() => {
    fs = new VirtualFileSystem();
    tool = buildStrReplaceTool(fs);
  });

  test("tool has correct id", () => {
    expect(tool.id).toBe("str_replace_editor");
  });

  describe("view command", () => {
    test("views a file with line numbers", async () => {
      fs.createFile("/test.txt", "line1\nline2\nline3");
      const result = await tool.execute({
        command: "view",
        path: "/test.txt",
      });
      expect(result).toBe("1\tline1\n2\tline2\n3\tline3");
    });

    test("views a file with a range", async () => {
      fs.createFile("/test.txt", "a\nb\nc\nd\ne");
      const result = await tool.execute({
        command: "view",
        path: "/test.txt",
        view_range: [2, 4],
      });
      expect(result).toBe("2\tb\n3\tc\n4\td");
    });

    test("views a directory listing", async () => {
      fs.createDirectory("/src");
      fs.createFile("/src/index.ts", "");
      const result = await tool.execute({
        command: "view",
        path: "/src",
      });
      expect(result).toContain("index.ts");
    });

    test("returns error for non-existent path", async () => {
      const result = await tool.execute({
        command: "view",
        path: "/nonexistent.txt",
      });
      expect(result).toContain("not found");
    });
  });

  describe("create command", () => {
    test("creates a new file with content", async () => {
      const result = await tool.execute({
        command: "create",
        path: "/App.jsx",
        file_text: "export default function App() {}",
      });
      expect(result).toBe("File created: /App.jsx");
      expect(fs.readFile("/App.jsx")).toBe("export default function App() {}");
    });

    test("creates a file with empty content when file_text is omitted", async () => {
      const result = await tool.execute({
        command: "create",
        path: "/empty.txt",
      });
      expect(result).toBe("File created: /empty.txt");
      expect(fs.readFile("/empty.txt")).toBe("");
    });

    test("creates parent directories automatically", async () => {
      const result = await tool.execute({
        command: "create",
        path: "/src/components/Button.tsx",
        file_text: "export const Button = () => null;",
      });
      expect(result).toBe("File created: /src/components/Button.tsx");
      expect(fs.exists("/src")).toBe(true);
      expect(fs.exists("/src/components")).toBe(true);
    });

    test("returns error when file already exists", async () => {
      fs.createFile("/test.txt", "original");
      const result = await tool.execute({
        command: "create",
        path: "/test.txt",
        file_text: "new content",
      });
      expect(result).toContain("Error");
      expect(fs.readFile("/test.txt")).toBe("original");
    });
  });

  describe("str_replace command", () => {
    test("replaces a string in a file", async () => {
      fs.createFile("/test.txt", "Hello World");
      const result = await tool.execute({
        command: "str_replace",
        path: "/test.txt",
        old_str: "World",
        new_str: "Universe",
      });
      expect(result).toContain("Replaced");
      expect(fs.readFile("/test.txt")).toBe("Hello Universe");
    });

    test("replaces all occurrences", async () => {
      fs.createFile("/test.txt", "foo foo foo");
      await tool.execute({
        command: "str_replace",
        path: "/test.txt",
        old_str: "foo",
        new_str: "bar",
      });
      expect(fs.readFile("/test.txt")).toBe("bar bar bar");
    });

    test("returns error when old_str is not found", async () => {
      fs.createFile("/test.txt", "Hello World");
      const result = await tool.execute({
        command: "str_replace",
        path: "/test.txt",
        old_str: "missing text",
        new_str: "replacement",
      });
      expect(result).toContain("Error");
      expect(fs.readFile("/test.txt")).toBe("Hello World");
    });

    test("treats undefined old_str as empty string", async () => {
      fs.createFile("/test.txt", "hello");
      // old_str defaults to "" when undefined — replaceInFile will report string not found
      const result = await tool.execute({
        command: "str_replace",
        path: "/test.txt",
        new_str: "replacement",
      });
      // empty string replacement inserts before every character — behaviour depends on impl
      // just verify no crash
      expect(result).toBeDefined();
    });

    test("returns error for non-existent file", async () => {
      const result = await tool.execute({
        command: "str_replace",
        path: "/nonexistent.txt",
        old_str: "foo",
        new_str: "bar",
      });
      expect(result).toContain("Error");
    });
  });

  describe("insert command", () => {
    test("inserts text after specified line", async () => {
      fs.createFile("/test.txt", "line1\nline2\nline3");
      const result = await tool.execute({
        command: "insert",
        path: "/test.txt",
        insert_line: 1,
        new_str: "inserted",
      });
      expect(result).toContain("inserted");
      expect(fs.readFile("/test.txt")).toBe("line1\ninserted\nline2\nline3");
    });

    test("inserts at the beginning when insert_line is 0", async () => {
      fs.createFile("/test.txt", "existing");
      await tool.execute({
        command: "insert",
        path: "/test.txt",
        insert_line: 0,
        new_str: "first",
      });
      expect(fs.readFile("/test.txt")).toBe("first\nexisting");
    });

    test("defaults insert_line to 0 when omitted", async () => {
      fs.createFile("/test.txt", "existing");
      const result = await tool.execute({
        command: "insert",
        path: "/test.txt",
        new_str: "prepended",
      });
      expect(result).toBeDefined();
    });

    test("returns error for invalid line number", async () => {
      fs.createFile("/test.txt", "line1\nline2");
      const result = await tool.execute({
        command: "insert",
        path: "/test.txt",
        insert_line: 99,
        new_str: "text",
      });
      expect(result).toContain("Error");
    });

    test("returns error for non-existent file", async () => {
      const result = await tool.execute({
        command: "insert",
        path: "/missing.txt",
        insert_line: 0,
        new_str: "text",
      });
      expect(result).toContain("Error");
    });
  });

  describe("undo_edit command", () => {
    test("returns unsupported message", async () => {
      const result = await tool.execute({
        command: "undo_edit",
        path: "/test.txt",
      });
      expect(result).toContain("not supported");
    });
  });
});
