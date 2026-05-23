import { createFileRoute, useNavigate } from "@tanstack/react-router";
import EventEditor from "@/components/EventEditor";

export const Route = createFileRoute("/dashboard_/events/$id/edit")({ component: EditEvent });

function EditEvent() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  return <EventEditor eventId={id} onSaved={() => nav({ to: "/dashboard" })} />;
}
