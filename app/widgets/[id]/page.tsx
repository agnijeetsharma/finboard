import WidgetDetail from "./widget-details"

export default function Page({ params }: { params: { id: string } }) {
  return <WidgetDetail id={params.id} />
}
