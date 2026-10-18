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
 * Must match SALT in mr-anas-hq …/r04-unit-1-exam/grading/publish-site.py.
 */
const SALT = 'mr-anas|results|unit-1'

export const resultToken = (attemptId: string) =>
  createHash('sha256').update(`${SALT}|file|${attemptId}`).digest('hex').slice(0, 24)

export const resultKey = (attemptId: string) =>
  createHash('sha256').update(`${SALT}|key|${attemptId}`).digest('base64')
