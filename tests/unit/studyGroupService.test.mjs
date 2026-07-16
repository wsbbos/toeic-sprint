import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createStudyGroup,
  joinStudyGroup,
  normalizeInviteCode,
  StudyGroupError,
} from '../../src/services/studyGroupService.js'

test('invite codes are normalized and invalid characters are rejected', () => {
  assert.equal(normalizeInviteCode(' ab 12 cd '), 'AB12CD')
  assert.equal(normalizeInviteCode('abc!23'), '')
  assert.equal(normalizeInviteCode('short'), '')
})

test('study group creation uses the authenticated client RPC without raw credentials', async () => {
  const calls = []
  const client = {
    rpc: async (name, params) => {
      calls.push({ name, params })
      return { data: { status: 'created', group_id: 'group-1', invite_code: 'ABC123' }, error: null }
    },
  }

  const result = await createStudyGroup(client, '  Sprint Team  ', 'abc123')
  assert.deepEqual(calls, [{
    name: 'create_study_group',
    params: { p_name: 'Sprint Team', p_invite_code: 'ABC123' },
  }])
  assert.deepEqual(result, { status: 'created', groupId: 'group-1', inviteCode: 'ABC123' })
})

test('join errors are converted to stable codes without exposing backend details', async () => {
  const client = { rpc: async () => ({ data: null, error: { message: 'private SQL detail', code: '42501' } }) }
  await assert.rejects(
    joinStudyGroup(client, 'ABC123'),
    (error) => error instanceof StudyGroupError
      && error.code === 'GROUP_REQUEST_FAILED'
      && !error.message.includes('private SQL detail'),
  )
})