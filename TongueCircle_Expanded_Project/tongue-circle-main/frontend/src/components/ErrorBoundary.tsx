import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error("Tongue Circle UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#FAF8F5] px-5 py-12">
        <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold text-stone-900">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">This page hit an unexpected problem. Your account data has not been intentionally changed.</p>
          <Button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-full bg-[#D9532F] text-white hover:bg-[#BD421F]">
            <RefreshCw className="mr-2 size-4" aria-hidden="true" /> Reload Tongue Circle
          </Button>
        </section>
      </main>
    );
  }
}
