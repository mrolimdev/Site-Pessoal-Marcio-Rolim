import fs from 'fs'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

function obterVarEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key]
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const lines = content.split('\n')
      for (const line of lines) {
        if (line.startsWith(key + '=')) {
          return line.substring(key.length + 1).trim().replace(/^['"]|['"]$/g, '')
        }
      }
    }
  } catch {}
  return undefined
}

/**
 * Cliente S3 para o repositório de armazenamento Cloudflare R2
 */
function obterClienteR2() {
  const accountId = obterVarEnv('R2_ACCOUNT_ID')?.trim()
  const accessKeyId = obterVarEnv('R2_ACCESS_KEY_ID')?.trim()
  const secretAccessKey = obterVarEnv('R2_SECRET_ACCESS_KEY')?.trim()
  const endpoint =
    obterVarEnv('R2_ENDPOINT')?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

/**
 * Obtém o domínio público do R2
 */
export function obterDominioPublicoR2(): string {
  const domain = obterVarEnv('R2_PUBLIC_DOMAIN')?.trim()
  if (domain) {
    return domain.replace(/\/$/, '')
  }
  const bucketName = obterVarEnv('R2_BUCKET_NAME')?.trim() || 'profetize'
  const accountId = obterVarEnv('R2_ACCOUNT_ID')?.trim()
  return `https://${bucketName}.${accountId}.r2.dev`
}

/**
 * Faz upload de um Buffer para o Cloudflare R2 e devolve a URL pública
 */
export async function uploadParaR2Buffer({
  buffer,
  filename,
  contentType = 'image/jpeg',
  pasta = 'capas',
}: {
  buffer: Buffer
  filename: string
  contentType?: string
  pasta?: string
}): Promise<string | null> {
  const s3 = obterClienteR2()
  if (!s3) {
    console.warn('[R2 Storage] Credenciais do Cloudflare R2 não configuradas no ambiente.')
    return null
  }

  const bucketName = obterVarEnv('R2_BUCKET_NAME')?.trim() || 'profetize'
  const key = pasta ? `${pasta}/${filename}` : filename

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3.send(command)

    const publicDomain = obterDominioPublicoR2()
    return `${publicDomain}/${key}`
  } catch (error) {
    console.error('[R2 Storage Upload Error]:', error)
    return null
  }
}

/**
 * Faz upload de uma string em formato Base64 para o Cloudflare R2
 */
export async function uploadParaR2Base64({
  base64Data,
  filename,
  contentType = 'image/jpeg',
  pasta = 'capas',
}: {
  base64Data: string
  filename: string
  contentType?: string
  pasta?: string
}): Promise<string | null> {
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(cleanBase64, 'base64')
  return uploadParaR2Buffer({ buffer, filename, contentType, pasta })
}
