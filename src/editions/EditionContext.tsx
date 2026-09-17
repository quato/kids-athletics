import { createContext, useContext, type ReactNode } from "react";
import type { Edition, EditionMode } from "./types";

export type EditionContextValue = {
  edition: Edition;
  mode: EditionMode;
};

const EditionContext = createContext<EditionContextValue | null>(null);

export function EditionProvider({
  edition,
  mode,
  children,
}: {
  edition: Edition;
  mode: EditionMode;
  children: ReactNode;
}) {
  return (
    <EditionContext.Provider value={{ edition, mode }}>
      {children}
    </EditionContext.Provider>
  );
}

export function useEdition(): EditionContextValue {
  const ctx = useContext(EditionContext);
  if (!ctx) {
    throw new Error("useEdition must be used within EditionProvider");
  }
  return ctx;
}
