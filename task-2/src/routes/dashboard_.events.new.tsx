import { createFileRoute, useNavigate } from "@tanstack/react-router";
import EventEditor from "@/components/EventEditor";

export const Route = createFileRoute("/dashboard_/events/new")({ component: NewEvent });

function NewEvent() {
  const nav = useNavigate();
  return <EventEditor onSaved={() => nav({ to: "/dashboard" })} />;
}
