import Link from 'next/link'

export default function PlayPage() {
  return (
    <div>
      Hey hey hey, this is play.
      <p>
        <Link href={'/notes/playground'}>Go!</Link>
      </p>
    </div>
  )
}
