"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { LibraryItem } from "../library/_data";
import { NAV_CENTER_CONTROL_WIDTH_CLASS } from "./nav-center-control";

export const LIBRARY_SEARCH_FADE_MS = 600;

export const LIBRARY_SEARCH_FADE_CLASS =
  "transition-opacity duration-[600ms] ease-out motion-reduce:transition-none";

export type LibrarySearchPhase = "grid" | "preview" | "blank" | "loading";

type LibrarySearchContextValue = {
  draftQuery: string;
  appliedQuery: string;
  gridQuery: string;
  searchPhase: LibrarySearchPhase;
  isPending: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  setDraftQuery: (next: string) => void;
  submitSearch: () => void;
  applySearch: (query: string) => void;
  clearSearch: () => void;
  signalGridReady: () => void;
};

const LibrarySearchContext = createContext<LibrarySearchContextValue | null>(
  null,
);

export function LibrarySearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef("");
  const fadeTimeoutRef = useRef<number | null>(null);
  const [draftQuery, setDraftQueryState] = useState("");
  const [appliedQuery, setAppliedQueryState] = useState("");
  const [gridQuery, setGridQueryState] = useState("");
  const [searchPhase, setSearchPhaseState] = useState<LibrarySearchPhase>("grid");

  const clearFadeTimeout = useCallback(() => {
    if (fadeTimeoutRef.current !== null) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearFadeTimeout();
  }, [clearFadeTimeout]);

  useEffect(() => {
    if (!pathname.startsWith("/library")) {
      clearFadeTimeout();
      draftRef.current = "";
      setDraftQueryState("");
      setAppliedQueryState("");
      setGridQueryState("");
      setSearchPhaseState("grid");
    }
  }, [pathname, clearFadeTimeout]);

  const setDraftQuery = useCallback((next: string) => {
    draftRef.current = next;
    setDraftQueryState(next);
  }, []);

  useEffect(() => {
    draftRef.current = draftQuery;
  }, [draftQuery]);

  const beginBlankTransition = useCallback(
    (onMidpoint: () => void) => {
      clearFadeTimeout();
      setSearchPhaseState("blank");
      fadeTimeoutRef.current = window.setTimeout(() => {
        fadeTimeoutRef.current = null;
        onMidpoint();
        setSearchPhaseState("loading");
      }, LIBRARY_SEARCH_FADE_MS);
    },
    [clearFadeTimeout],
  );

  const signalGridReady = useCallback(() => {
    setSearchPhaseState((current) =>
      current === "loading" ? "grid" : current,
    );
  }, []);

  const applySearch = useCallback(
    (query: string) => {
      const next = query.trim();
      if (!next) return;
      if (searchPhase === "blank" || searchPhase === "loading") return;
      if (next === appliedQuery.trim()) return;

      beginBlankTransition(() => {
        draftRef.current = next;
        setDraftQueryState(next);
        setAppliedQueryState(next);
        setGridQueryState(next);
      });
    },
    [appliedQuery, searchPhase, beginBlankTransition],
  );

  const submitSearch = useCallback(() => {
    applySearch(draftQuery);
  }, [draftQuery, applySearch]);

  const clearSearch = useCallback(() => {
    if (!draftQuery && !appliedQuery) return;
    if (searchPhase === "blank" || searchPhase === "loading") return;

    beginBlankTransition(() => {
      draftRef.current = "";
      setDraftQueryState("");
      setAppliedQueryState("");
      setGridQueryState("");
    });
  }, [draftQuery, appliedQuery, searchPhase, beginBlankTransition]);

  const isPending = useMemo(
    () => draftQuery.trim() !== appliedQuery.trim(),
    [draftQuery, appliedQuery],
  );

  useEffect(() => {
    if (searchPhase === "blank" || searchPhase === "loading") return;

    const hasDraft = draftQuery.trim().length > 0;

    if (isPending && hasDraft) {
      setSearchPhaseState((current) =>
        current === "grid" ? "preview" : current,
      );
      return;
    }

    if (!isPending && searchPhase === "preview") {
      setSearchPhaseState("grid");
    }
  }, [isPending, draftQuery, searchPhase]);

  useEffect(() => {
    if (!pathname.startsWith("/library")) return;

    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (!q) return;

    params.delete("q");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${pathname}?${qs}` : pathname,
    );

    applySearch(q);
  }, [pathname, applySearch]);

  useEffect(() => {
    if (!pathname.startsWith("/library")) return;

    const focusInput = () => {
      inputRef.current?.focus({ preventScroll: true });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (searchPhase === "blank" || searchPhase === "loading") return;
      if (shouldIgnoreLibrarySearchKey(event)) return;
      if (document.querySelector("[data-library-lightbox]")) return;

      const input = inputRef.current;
      if (event.target === input) return;

      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch();
        focusInput();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        const next = draftRef.current.slice(0, -1);
        if (next === "") clearSearch();
        else setDraftQuery(next);
        focusInput();
        return;
      }

      if (event.key.length === 1) {
        event.preventDefault();
        setDraftQuery(draftRef.current + event.key);
        focusInput();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    pathname,
    searchPhase,
    setDraftQuery,
    submitSearch,
    clearSearch,
  ]);

  useEffect(() => {
    if (!pathname.startsWith("/library")) return;

    const focusInput = () => {
      inputRef.current?.focus({ preventScroll: true });
    };

    if (window.matchMedia("(min-width: 768px)").matches) {
      const id = requestAnimationFrame(focusInput);
      return () => cancelAnimationFrame(id);
    }
  }, [pathname]);

  const value = useMemo(
    () => ({
      draftQuery,
      appliedQuery,
      gridQuery,
      searchPhase,
      isPending,
      inputRef,
      setDraftQuery,
      submitSearch,
      applySearch,
      clearSearch,
      signalGridReady,
    }),
    [
      draftQuery,
      appliedQuery,
      gridQuery,
      searchPhase,
      isPending,
      setDraftQuery,
      submitSearch,
      applySearch,
      clearSearch,
      signalGridReady,
    ],
  );

  return (
    <LibrarySearchContext.Provider value={value}>
      {children}
    </LibrarySearchContext.Provider>
  );
}

export function useLibrarySearch(): LibrarySearchContextValue {
  const ctx = useContext(LibrarySearchContext);
  if (!ctx) {
    throw new Error(
      "useLibrarySearch must be used within LibrarySearchProvider",
    );
  }
  return ctx;
}

export function matchesLibrarySearch(
  item: LibraryItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [item.title, item.description, ...item.tags]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function shouldIgnoreLibrarySearchKey(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return true;

  const target = event.target;
  if (!(target instanceof Element)) return false;

  if (target.closest("[data-library-lightbox]")) return true;
  if (target.closest("#site-mobile-nav")) return true;
  if (target.closest('[data-library-search-input="true"]')) return false;

  if (
    target.closest('input:not([data-library-search-input="true"]), textarea, select, [contenteditable="true"]')
  ) {
    return true;
  }

  return false;
}

export function LibrarySearchVeil() {
  const { searchPhase } = useLibrarySearch();
  const covered =
    searchPhase === "blank" ||
    searchPhase === "loading" ||
    searchPhase === "preview";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[5] bg-white ${LIBRARY_SEARCH_FADE_CLASS} ${
        covered ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export function LibrarySearchPreview() {
  const { draftQuery, searchPhase } = useLibrarySearch();
  const visible = searchPhase === "preview" && draftQuery.trim().length > 0;

  return (
    <div
      aria-live="polite"
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 ${LIBRARY_SEARCH_FADE_CLASS} ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="max-w-[min(100%,90vw)] text-center text-[60px] font-medium uppercase leading-[0.95] tracking-[0.02em] text-black break-words">
        {draftQuery}
      </p>
    </div>
  );
}

export function LibrarySearchInput({ className = "" }: { className?: string }) {
  const { draftQuery, inputRef, searchPhase, setDraftQuery, submitSearch, clearSearch } =
    useLibrarySearch();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  const isEmpty = draftQuery.length === 0;
  const locked = searchPhase === "blank" || searchPhase === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      className={`block ${NAV_CENTER_CONTROL_WIDTH_CLASS} ${className}`}
    >
      <label className={`relative block ${isEmpty ? "cursor-pointer" : ""}`}>
        <span className="sr-only">Search library</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-1 text-center text-[11px] font-medium uppercase tracking-[0.02em] text-black/30 ${LIBRARY_SEARCH_FADE_CLASS} ${
            isEmpty ? "opacity-100" : "opacity-0"
          }`}
        >
          START TYPING TO SEARCH
        </span>
        <input
          ref={inputRef}
          type="search"
          data-library-search-input="true"
          value={draftQuery}
          readOnly={locked}
          onChange={(event) => {
            if (locked) return;
            const next = event.target.value;
            if (next === "") {
              clearSearch();
              return;
            }
            setDraftQuery(next);
          }}
          enterKeyHint="search"
          className={`w-full border-0 bg-transparent pb-1 text-center text-[11px] font-medium uppercase tracking-[0.02em] outline-none ${LIBRARY_SEARCH_FADE_CLASS} ${
            isEmpty
              ? "cursor-pointer text-transparent caret-transparent"
              : "text-black caret-black"
          }`}
        />
      </label>
    </form>
  );
}
