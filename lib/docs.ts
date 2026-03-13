// lib/docs.ts — Reads markdown files from content/dgcp-intel/
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'dgcp-intel')

export interface DocContent {
  content: string
  frontmatter: Record<string, unknown>
  filePath: string
}

export function getDoc(filePath: string): DocContent | null {
  const fullPath = path.join(CONTENT_ROOT, filePath)
  if (!fs.existsSync(fullPath)) return null

  const raw = fs.readFileSync(fullPath, 'utf-8')
  const { content, data } = matter(raw)

  return {
    content,
    frontmatter: data,
    filePath,
  }
}
