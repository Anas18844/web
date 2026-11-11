import 'server-only'
import { createHash } from 'node:crypto'

/**
 * Exam results, published as encrypted files (owner, 2026-10-18: WhatsApp
 * restricted the number, so students download their reports from the site).
 *
 * The repo is public, so every PDF under public/files/results/ is AES-GCM
 * ciphertext. Each one's key and file name are hashes of the student's attempt
 * id, which only Supabase holds. Whoever types a phone number gets back the
 * keys of the attempts made with that number and nothing else.
 *
 * One salt per exam. Must match SALT in mr-anas-hq
 * …/r04-unit-N-exam/grading/publish-site.py.
 */
const salt = (slug: string) => `mr-anas|results|${slug}`

export const resultToken = (attemptId: string, slug = 'unit-1') =>
  createHash('sha256').update(`${salt(slug)}|file|${attemptId}`).digest('hex').slice(0, 24)

export const resultKey = (attemptId: string, slug = 'unit-1') =>
  createHash('sha256').update(`${salt(slug)}|key|${attemptId}`).digest('base64')
