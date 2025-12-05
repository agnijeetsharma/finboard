import WidgetDetail from "./widget-detail"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return <WidgetDetail id={id} />
}
