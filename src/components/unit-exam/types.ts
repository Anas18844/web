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

/** Unit 2: the network drawing comes as an SVG from the generator (no answers in it). */
export type DmzItem = Base & { type: 'dmz'; stem: string; svg: string; parts: number; servers: string[] }
/** Unit 2: the risk matrix. Rows = impact high→low, columns = likelihood high→low (right to left). */
export type MatrixCell = { value: string } | { blank: number }
export type MatrixItem = Base & { type: 'matrix'; stem: string; grid: MatrixCell[][]; levels: string[]; task: string }
/** Unit 2: an essay in parts (أ) and (ب). */
export type OpenItem = Base & { type: 'open'; stem: string; parts: { q: string; marks: number }[] }

export type ExamItem =
  | McqItem | TfItem | TermItem | GapItem | NestedItem | TimelineItem | CompareItem | DmzItem | MatrixItem | OpenItem

export type PublicUnitExam = {
  slug: string
  sections: { key: SectionKey; n: number; title: string; marks: string }[]
  /** Unit 1 had a gift question; unit 2 has none. */
  bonus: { title: string; mark: string; options: string[] } | null
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
  | { names: string[]; place: string[] } // dmz
  | { cells: string[]; mark: [number, number] | null } // matrix
  // open: string[] (one text per part)

export type Answers = Record<string, AnswerValue | undefined>
