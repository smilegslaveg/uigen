"use client";

import { Loader2 } from "lucide-react";

export interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const basename =
    String(args.path ?? "")
      .split("/")
      .filter(Boolean)
      .pop() ?? "";
  const suffix = basename ? " " + basename : "";

  if (toolName === "str_replace_editor") {
    const command = args.command;
    if (command === "create") return "Creating" + suffix;
    if (command === "str_replace" || command === "insert" || command === "undo_edit")
      return "Editing" + suffix;
    if (command === "view") return "Viewing" + suffix;
  }

  if (toolName === "file_manager") {
    const command = args.command;
    if (command === "rename") return "Renaming" + suffix;
    if (command === "delete") return "Deleting" + suffix;
  }

  return toolName
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);
  const isDone = state === "result" && Boolean(result);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
