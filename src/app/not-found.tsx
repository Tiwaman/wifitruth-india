import { EmptyState } from "@/components/EmptyState";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-14 sm:py-20">
      <div data-testid="not-found" className="space-y-5 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">We could not find that page</h1>
        <EmptyState title="Looks like this trail goes nowhere" text="The stay may have been removed or the link is wrong." cta={{ href: "/", label: "Search for a stay" }} />
      </div>
    </Container>
  );
}
