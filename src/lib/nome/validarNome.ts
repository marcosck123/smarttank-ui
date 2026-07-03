/**
 * Validação e autocorreção de nome de operador — SmartTank
 *
 * Objetivos:
 *  1. Bloquear nomes-lixo (ex: "sadsad", "asdf", "aaaa") antes de deixar entrar.
 *  2. Autocorrigir digitação errada contra a lista de nomes já conhecidos
 *     (ex: "lucsa" → "Lucas") usando distância de Levenshtein.
 */

const VOGAIS = new Set('aeiouáàâãéêíóôõúü')

// Sequências de teclado comuns — se o nome for um pedaço disso, é lixo.
const SEQUENCIAS_TECLADO = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1234567890', 'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz',
]

/** Remove acentos e baixa a caixa para comparação. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** true se a string inteira for um pequeno bloco repetido (ex: "sadsad" = "sad"×2). */
function ehBlocoRepetido(s: string): boolean {
  const n = s.length
  for (let p = 1; p <= n / 2; p++) {
    if (n % p !== 0) continue
    if (s.slice(0, p).repeat(n / p) === s) return true
  }
  return false
}

/** Title Case respeitando partículas (de, da, do, dos, e). */
export function capitalizarNome(s: string): string {
  const particulas = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((palavra, i) => {
      const lower = palavra.toLowerCase()
      if (i > 0 && particulas.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

export interface ResultadoValidacao {
  valido: boolean
  motivo?: string
}

/** Heurística anti-lixo: decide se a string parece um nome de gente. */
export function validarNome(input: string): ResultadoValidacao {
  const bruto = input.trim()
  if (bruto.length < 2) return { valido: false, motivo: 'Digite pelo menos 2 letras.' }
  if (bruto.length > 40) return { valido: false, motivo: 'Nome muito longo.' }

  const norm = normalizar(bruto)

  // Só letras e espaços
  if (!/^[a-z\s]+$/.test(norm)) {
    return { valido: false, motivo: 'Use apenas letras.' }
  }

  const semEspaco = norm.replace(/\s/g, '')
  const letras = semEspaco.split('')

  // Precisa ter vogais
  const qtdVogais = letras.filter(c => VOGAIS.has(c)).length
  if (qtdVogais === 0) return { valido: false, motivo: 'Isso não parece um nome.' }

  const ratioVogais = qtdVogais / letras.length
  if (ratioVogais < 0.2) return { valido: false, motivo: 'Isso não parece um nome.' }

  // Pelo menos 2 letras distintas de verdade
  if (new Set(letras).size < 2) return { valido: false, motivo: 'Isso não parece um nome.' }

  // 3+ letras iguais seguidas (aaa, sss)
  if (/(.)\1\1/.test(semEspaco)) return { valido: false, motivo: 'Isso não parece um nome.' }

  // Bloco repetido: "sadsad", "asdasd", "abcabc" (a partir de 6 letras)
  if (semEspaco.length >= 6 && ehBlocoRepetido(semEspaco)) {
    return { valido: false, motivo: 'Isso não parece um nome.' }
  }

  // Run de 5+ consoantes seguidas
  if (/[^aeiouáàâãéêíóôõúü\s]{5,}/.test(norm)) {
    return { valido: false, motivo: 'Isso não parece um nome.' }
  }

  // Sequência de teclado (o nome inteiro é um pedaço de uma fileira)
  for (const seq of SEQUENCIAS_TECLADO) {
    if (semEspaco.length >= 4 && seq.includes(semEspaco)) {
      return { valido: false, motivo: 'Isso não parece um nome.' }
    }
  }

  return { valido: true }
}

/**
 * Distância de edição de Damerau (Optimal String Alignment):
 * conta uma TROCA de letras adjacentes como 1 edição — essencial para
 * corrigir digitação errada tipo "lucsa" → "lucas" ou "maira" → "maria".
 */
export function distanciaEdicao(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + custo)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1)
      }
    }
  }
  return dp[m][n]
}

export interface ResultadoAutocorrecao {
  nome: string          // nome final sugerido (capitalizado)
  corrigido: boolean    // true se casou com um conhecido diferente do digitado
  original: string      // o que foi digitado (capitalizado)
}

/**
 * Tenta casar o input com um nome já conhecido. Compara apenas o PRIMEIRO nome
 * (parte antes do primeiro espaço) para tolerar sobrenomes ausentes.
 * Retorna o conhecido se a distância estiver dentro do limiar proporcional.
 */
export function autocorrigirNome(input: string, nomesConhecidos: string[]): ResultadoAutocorrecao {
  const originalCap = capitalizarNome(input)
  const primeiroInput = normalizar(input).split(' ')[0]
  if (!primeiroInput) return { nome: originalCap, corrigido: false, original: originalCap }

  let melhor: { nome: string; dist: number } | null = null

  for (const conhecido of nomesConhecidos) {
    const primeiroConhecido = normalizar(conhecido).split(' ')[0]
    if (!primeiroConhecido) continue

    // match exato do primeiro nome → mantém o que foi digitado (com sobrenome se houver)
    if (primeiroConhecido === primeiroInput) {
      return { nome: originalCap, corrigido: false, original: originalCap }
    }

    const dist = distanciaEdicao(primeiroInput, primeiroConhecido)
    if (!melhor || dist < melhor.dist) melhor = { nome: conhecido, dist }
  }

  if (melhor) {
    // limiar: nomes curtos toleram 1 erro, mais longos toleram ~1/3 do tamanho
    const limiar = Math.max(1, Math.floor(primeiroInput.length / 3))
    if (melhor.dist > 0 && melhor.dist <= limiar) {
      return { nome: capitalizarNome(melhor.nome), corrigido: true, original: originalCap }
    }
  }

  return { nome: originalCap, corrigido: false, original: originalCap }
}
