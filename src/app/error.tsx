"use client";

import { Button, Container } from "@/components/ui";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Container className="py-14 sm:py-20">
      <div role="alert" className="space-y-4 rounded-3xl border border-red-300 bg-red-50 p-8 text-center">
        <h1 className="font-display text-3xl font-bold text-red-950">Something went wrong</h1>
        <p className="text-red-950">We hit a problem loading this page. Please try again.</p>
        <Button variant="dark" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </Container>
  );
}
