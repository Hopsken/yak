export default function NotePage({ params }: { params: { slug: string } }) {
  return <div>This is intercepted. SLUG: {params.slug}</div>
}
