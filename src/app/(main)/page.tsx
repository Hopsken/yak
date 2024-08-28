import { ScrollContainer, StickyNote } from '@/components/StackedNotes'

const Notes = [
  {
    title: 'Helle World',
    children: 'Loream Ipusm'
  },
  {
    title: 'JavaScript',
    children: 'Loream Ipusm'
  },
  {
    title: 'React',
    children: 'Loream Ipusm'
  },
  {
    title: '飞去南方',
    children: 'Loream Ipusm'
  },
  {
    title: '你的名字',
    children: 'Loream Ipusm'
  }
]

export default function Home() {
  return (
    <ScrollContainer panes={Notes.length}>
      {Notes.map((note, index) => (
        <StickyNote key={note.title} title={note.title} index={index}>
          {note.children}
        </StickyNote>
      ))}
    </ScrollContainer>
  )
}
