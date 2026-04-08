import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor label generation ---

test("ToolCallBadge shows 'Creating Card.jsx' for str_replace_editor create", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/components/Card.jsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("ToolCallBadge shows 'Editing Button.tsx' for str_replace_editor str_replace", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/src/Button.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("ToolCallBadge shows 'Editing App.tsx' for str_replace_editor insert", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/App.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("ToolCallBadge shows 'Editing utils.ts' for str_replace_editor undo_edit", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "/lib/utils.ts" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Editing utils.ts")).toBeDefined();
});

test("ToolCallBadge shows 'Viewing index.tsx' for str_replace_editor view", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/pages/index.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Viewing index.tsx")).toBeDefined();
});

// --- file_manager label generation ---

test("ToolCallBadge shows 'Renaming OldName.tsx' for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/components/OldName.tsx", new_path: "/components/NewName.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Renaming OldName.tsx")).toBeDefined();
});

test("ToolCallBadge shows 'Deleting Card.jsx' for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/components/Card.jsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Deleting Card.jsx")).toBeDefined();
});

// --- Fallback cases ---

test("ToolCallBadge falls back to capitalized tool name for unknown tool", () => {
  render(
    <ToolCallBadge
      toolName="code_runner"
      args={{}}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Code Runner")).toBeDefined();
});

test("ToolCallBadge falls back for str_replace_editor with unknown command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "unknown_cmd", path: "/foo.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Str Replace Editor")).toBeDefined();
});

test("ToolCallBadge shows label without filename when path is missing", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Creating")).toBeDefined();
});

// --- Visual state ---

test("ToolCallBadge shows green dot and no spinner when state=result with truthy result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows spinner and no green dot when state=call", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows spinner when state=result but result is falsy", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      state="result"
      result=""
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge wrapper has font-mono class", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      state="call"
    />
  );
  expect(container.firstChild).toBeDefined();
  expect((container.firstChild as HTMLElement).className).toContain("font-mono");
});
