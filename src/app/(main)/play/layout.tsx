import { ReactNode } from 'react'

export default function PlayLayout(props: {
  children: ReactNode
  addon: ReactNode
}) {
  return (
    <>
      {props.addon}
      {props.children}
    </>
  )
}
