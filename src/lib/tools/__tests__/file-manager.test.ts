import { test, expect, describe, beforeEach } from "vitest";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { VirtualFileSystem } from "@/lib/file-system";

describe("buildFileManagerTool", () => {
  let fs: VirtualFileSystem;
  let tool: ReturnType<typeof buildFileManagerTool>;

  beforeEach(() => {
    fs = new VirtualFileSystem();
    tool = buildFileManagerTool(fs);
  });

  describe("rename command", () => {
    test("renames a file successfully", async () => {
      fs.createFile("/old.txt", "content");
      const result = await tool.execute({
        command: "rename",
        path: "/old.txt",
        new_path: "/new.txt",
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("/old.txt");
      expect(result.message).toContain("/new.txt");
      expect(fs.exists("/old.txt")).toBe(false);
      expect(fs.exists("/new.txt")).toBe(true);
      expect(fs.readFile("/new.txt")).toBe("content");
    });

    test("renames a directory and all its children", async () => {
      fs.createDirectory("/src");
      fs.createFile("/src/index.ts", "index");
      fs.createFile("/src/App.tsx", "app");
      const result = await tool.execute({
        command: "rename",
        path: "/src",
        new_path: "/app",
      });
      expect(result.success).toBe(true);
      expect(fs.exists("/src")).toBe(false);
      expect(fs.exists("/app")).toBe(true);
      expect(fs.readFile("/app/index.ts")).toBe("index");
      expect(fs.readFile("/app/App.tsx")).toBe("app");
    });

    test("moves a file to a different directory", async () => {
      fs.createFile("/utils.ts", "helpers");
      fs.createDirectory("/lib");
      const result = await tool.execute({
        command: "rename",
        path: "/utils.ts",
        new_path: "/lib/utils.ts",
      });
      expect(result.success).toBe(true);
      expect(fs.exists("/utils.ts")).toBe(false);
      expect(fs.readFile("/lib/utils.ts")).toBe("helpers");
    });

    test("creates parent directories when moving to a new location", async () => {
      fs.createFile("/component.tsx", "component");
      const result = await tool.execute({
        command: "rename",
        path: "/component.tsx",
        new_path: "/src/components/component.tsx",
      });
      expect(result.success).toBe(true);
      expect(fs.exists("/src/components/component.tsx")).toBe(true);
    });

    test("returns error when new_path is not provided", async () => {
      fs.createFile("/test.txt", "content");
      const result = await tool.execute({
        command: "rename",
        path: "/test.txt",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("new_path");
    });

    test("returns error when source path does not exist", async () => {
      const result = await tool.execute({
        command: "rename",
        path: "/nonexistent.txt",
        new_path: "/new.txt",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("returns error when destination already exists", async () => {
      fs.createFile("/source.txt", "source");
      fs.createFile("/dest.txt", "dest");
      const result = await tool.execute({
        command: "rename",
        path: "/source.txt",
        new_path: "/dest.txt",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // source is preserved
      expect(fs.readFile("/source.txt")).toBe("source");
    });
  });

  describe("delete command", () => {
    test("deletes a file successfully", async () => {
      fs.createFile("/remove-me.txt", "content");
      const result = await tool.execute({
        command: "delete",
        path: "/remove-me.txt",
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("/remove-me.txt");
      expect(fs.exists("/remove-me.txt")).toBe(false);
    });

    test("deletes a directory and all its contents", async () => {
      fs.createDirectory("/old");
      fs.createFile("/old/file1.txt", "a");
      fs.createFile("/old/file2.txt", "b");
      fs.createDirectory("/old/nested");
      fs.createFile("/old/nested/deep.txt", "c");

      const result = await tool.execute({
        command: "delete",
        path: "/old",
      });
      expect(result.success).toBe(true);
      expect(fs.exists("/old")).toBe(false);
      expect(fs.exists("/old/file1.txt")).toBe(false);
      expect(fs.exists("/old/nested/deep.txt")).toBe(false);
    });

    test("returns error when path does not exist", async () => {
      const result = await tool.execute({
        command: "delete",
        path: "/nonexistent.txt",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("returns error when attempting to delete root", async () => {
      const result = await tool.execute({
        command: "delete",
        path: "/",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
