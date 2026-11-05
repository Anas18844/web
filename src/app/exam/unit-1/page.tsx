import { redirect } from 'next/navigation'

/** The unit-1 exam is over; old links (WhatsApp, posts) land on the current exam. */
export default function UnitOneExam() {
  redirect('/exam/unit-2')
}
