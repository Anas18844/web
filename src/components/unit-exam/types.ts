/**
 * The shape of the unit-exam paper as the browser receives it — generated in
 * mr-anas-hq by r04-unit-1-exam/web/make-exam-web.py. It never carries an
 * answer; the key stays out of this repository.
 */
export type SectionKey = 'mcq' | 'tf' | 'term' | 'gap' | 'fig' | 'cmp'

type Base = { id: string; n: number; marks: number; section: SectionKey }

/** `optionOrder`: display order of the ORIGINAL option indices, set per student. */
export type McqItem = Base & { type: 'mcq'; stem: string; options: string[]; optionOrder?: number[] }
export type TfItem = Base & { type: 'tf'; term: string; definition: string }
export type TermItem = Base & { type: 'term'; stem: string }
export type GapItem = Base & { type: 'gap'; parts: string[] }
export type NestedItem = Base & { type: 'nested'; stem: string; levels: number; examples: string[] }
export type TimelineItem = Base & {
  type: 'timeline'
  stem: string
  slots: string[]
  cards: { key: string; text: string }[]
}
export type CompareItem = Base & {
  type: 'compare'
  stem: string
  columns: string[]
  rows: string[]
  star: boolean
}

export type ExamItem = McqItem | TfItem | TermItem | GapItem | NestedItem | TimelineItem | CompareItem

export type PublicUnitExam = {
  slug: string
  sections: { key: SectionKey; n: number; title: string; marks: string }[]
  bonus: { title: string; mark: string; options: string[] }
  items: ExamItem[]
}

/** One answer per question id; the shape depends on the question type. */
export type AnswerValue =
  | number // mcq, bonus
  | string // term
  | string[] // gap, timeline
  | { judge: 'T' | 'F' | ''; fix: string } // tf
  | { names: string[]; ex: string[] } // nested
  | string[][] // compare

export type Answers = Record<string, AnswerValue | undefined>
