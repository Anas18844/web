'use client'

import { useState } from 'react'
import type { Lead } from '@/lib/leads-repo'
import {
  ATTENDANCE_LABELS,
  BRANCH_LABELS,
  GRADE_LABELS,
  HEARD_FROM_LABELS,
  SOURCE_LABELS,
  STAGE_LABELS,
  STATUS_LABELS,
  formatDateTime,
  label,
} from '@/lib/dashboard-labels'
import { EditLead } from './EditLead'

/**
 * The list of students.
 *
 * A table on desktop, a stack of cards on a phone. Not a table that scrolls
 * sideways — the follow-up team works from phones, and a horizontally scrolling
 * table is how a column ends up never being read.
 *
 * `lead.phone` is null for a team session because the column was never
 * selected. This component does not decide that and cannot override it; it only
 * describes what is not there.
 */
export function LeadTable({ leads, isAdmin }: { leads: Lead[]; isAdmin: boolean }) {
  const [editing, setEditing] = useState<Lead | null>(null)

  if (leads.length === 0) {
    return (
      <div className="rounded border border-navy-line bg-navy-soft/30 p-10 text-center">
        <p className="text-sm font-bold text-ink">مفيش نتايج</p>
        <p className="mt-1.5 text-xs text-ink-faint">
          جرّب تشيل شوية فلاتر، أو ضيف طالب يدوي من الزرار فوق.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ── Phone: cards ───────────────────────────────────────────────── */}
      <ul className="grid gap-3 lg:hidden">
        {leads.map((lead) => (
          <li key={lead.id} className="rounded border border-navy-line bg-navy-soft/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-ink">{lead.name}</p>
                <p className="mt-0.5 text-xs text-ink-faint">{formatDateTime(lead.created_at)}</p>
              </div>
              <StageBadge stage={lead.stage} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <Cell term="الصف" value={label(GRADE_LABELS, lead.grade)} />
              <Cell term="الحالة" value={label(STATUS_LABELS, lead.status)} />
              <Cell term="التليفون" value={<Phone value={lead.phone} isAdmin={isAdmin} />} />
              <Cell term="جه منين" value={label(HEARD_FROM_LABELS, lead.heard_from)} />
              <Cell term="بيدرس" value={label(ATTENDANCE_LABELS, lead.attendance)} />
              <Cell term="المصدر" value={label(SOURCE_LABELS, lead.source)} />
            </dl>

            {lead.note && (
              <p className="mt-3 border-s-2 border-gold/50 ps-3 text-xs leading-relaxed text-ink-muted">
                {lead.note}
              </p>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditing(lead)}
                className="mt-3 rounded border border-navy-line px-3 py-1.5 text-xs font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
              >
                تعديل
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* ── Desktop: table ─────────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded border border-navy-line lg:block">
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-navy-line bg-navy-soft/60 text-xs text-ink-faint">
              <Th>الاسم</Th>
              <Th>التليفون</Th>
              <Th>الصف</Th>
              <Th>بيدرس</Th>
              <Th>الفرع</Th>
              <Th>جه منين</Th>
              <Th>الحالة</Th>
              <Th>الفورم</Th>
              <Th>المصدر</Th>
              <Th>التاريخ</Th>
              {isAdmin && <Th>تعديل</Th>}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-navy-line/60 transition-colors duration-150 last:border-0 hover:bg-navy-soft/40"
              >
                <Td className="font-bold text-ink">{lead.name}</Td>
                <Td>
                  <Phone value={lead.phone} isAdmin={isAdmin} />
                </Td>
                <Td>{label(GRADE_LABELS, lead.grade)}</Td>
                <Td>{label(ATTENDANCE_LABELS, lead.attendance)}</Td>
                <Td>{label(BRANCH_LABELS, lead.branch)}</Td>
                <Td>{label(HEARD_FROM_LABELS, lead.heard_from)}</Td>
                <Td>{label(STATUS_LABELS, lead.status)}</Td>
                <Td>
                  <StageBadge stage={lead.stage} />
                </Td>
                <Td>{label(SOURCE_LABELS, lead.source)}</Td>
                <Td className="whitespace-nowrap text-xs text-ink-faint">
                  {formatDateTime(lead.created_at)}
                </Td>
                {isAdmin && (
                  <Td>
                    <button
                      type="button"
                      onClick={() => setEditing(lead)}
                      className="rounded border border-navy-line px-2.5 py-1 text-xs font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
                    >
                      تعديل
                    </button>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && editing && <EditLead lead={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

/**
 * Says "you are not allowed to see this", never "there is no number".
 *
 * The distinction matters operationally: a team member who reads a blank cell
 * as missing data goes looking for the number somewhere else, or re-asks the
 * student for it. The lock has to be legible as a lock.
 */
function Phone({ value, isAdmin }: { value: string | null; isAdmin: boolean }) {
  if (isAdmin) {
    return value ? (
      <a
        href={`tel:${value}`}
        dir="ltr"
        className="font-mono text-ink transition-colors duration-200 hover:text-gold"
      >
        {value}
      </a>
    ) : (
      <span className="text-ink-faint">—</span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-ink-faint" title="الأرقام للأدمن بس">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="text-xs">للأدمن</span>
    </span>
  )
}

function StageBadge({ stage }: { stage: string }) {
  const partial = stage === 'partial'
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-[0.7rem] font-bold ${
        partial ? 'bg-gold/15 text-gold' : 'bg-navy-line/60 text-ink-muted'
      }`}
    >
      {label(STAGE_LABELS, stage)}
    </span>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 text-start font-bold">{children}</th>
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 text-ink-muted ${className ?? ''}`}>{children}</td>
}

function Cell({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-ink-faint">{term}</dt>
      <dd className="mt-0.5 font-bold text-ink-muted">{value}</dd>
    </div>
  )
}
