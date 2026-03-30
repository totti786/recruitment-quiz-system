import { selectDeterministicQuestions } from '../lib/quizSession.js'

describe('quiz session helpers', () => {
  it('selects a stable question set for the same seed', () => {
    const questions = Array.from({ length: 6 }, (_, index) => ({ id: index + 1 }))

    const first = selectDeterministicQuestions(questions, 3, 'session-1')
    const second = selectDeterministicQuestions(questions, 3, 'session-1')

    expect(first).toEqual(second)
  })

  it('changes question ordering when the seed changes', () => {
    const questions = Array.from({ length: 6 }, (_, index) => ({ id: index + 1 }))

    const first = selectDeterministicQuestions(questions, 3, 'session-1')
    const second = selectDeterministicQuestions(questions, 3, 'session-2')

    expect(first).not.toEqual(second)
  })
})
