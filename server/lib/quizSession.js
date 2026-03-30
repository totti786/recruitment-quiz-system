export const SESSION_TOKEN_TYPE = 'quiz-session'

function createSeed(value) {
  let hash = 2166136261
  const input = String(value)

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function seededRandom(seed) {
  let state = createSeed(seed) || 1

  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) / 4294967296)
  }
}

export function selectDeterministicQuestions(questions, count, seed) {
  const random = seededRandom(seed)
  const pool = [...questions]

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]]
  }

  return pool.slice(0, Math.max(0, count))
}

export function buildQuizSessionTokenPayload(candidateSession) {
  return {
    type: SESSION_TOKEN_TYPE,
    candidateSessionId: candidateSession.id,
    candidateId: candidateSession.candidateId,
    sessionId: candidateSession.sessionId,
  }
}
