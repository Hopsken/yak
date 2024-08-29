import Link from 'next/link'

export default function PlayPage() {
  return (
    <div>
      Hey hey hey, this is play.
      <p>
        <Link href={'/notes/ hello-world'}>Go!</Link>
      </p>
    </div>
  )
}
