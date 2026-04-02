import { Command as RawCommand, CommandInput as RawCommandInput, CommandList as RawCommandList, CommandEmpty as RawCommandEmpty, CommandItem as RawCommandItem } from "cmdk";
import React from "react";

export function Command({ children }) {
  return (
    <RawCommand className="rounded-lg border border-white/10 bg-slate-900/95 p-2 text-white shadow-xl">
      {children}
    </RawCommand>
  );
}

export function CommandInput(props) {
  return (
    <RawCommandInput
      autoFocus
      className="w-full rounded-md border border-white/20 bg-slate-800 px-2 py-1 text-sm text-white outline-none ring-0 focus:border-sky-400"
      {...props}
    />
  );
}

export function CommandList({ children }) {
  return <RawCommandList className="max-h-64 overflow-auto">{children}</RawCommandList>;
}

export function CommandEmpty({ children }) {
  return <RawCommandEmpty className="p-2 text-[12px] text-white/50">{children}</RawCommandEmpty>;
}

export function CommandItem({ children, ...props }) {
  return (
    <RawCommandItem
      className="cursor-pointer rounded-md px-2 py-1 text-sm text-white hover:bg-slate-700"
      {...props}
    >
      {children}
    </RawCommandItem>
  );
}
