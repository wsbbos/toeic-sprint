const DEFAULT_TIMEOUT_MS = 12_000
const INVITE_CODE_PATTERN = /^[A-Z0-9]{6,10}$/

export class StudyGroupError extends Error {
  constructor(code) {
    super('Study group request failed')
    this.name = 'StudyGroupError'
    this.code = code
  }
}

export const getStudyGroupErrorMessage = (error) => {
  const code = error instanceof StudyGroupError ? error.code : 'GROUP_REQUEST_FAILED'
  const messages = {
    GROUP_CLIENT_UNAVAILABLE: '雲端小隊功能目前未設定，請稍後再試。',
    GROUP_NAME_INVALID: '小隊名稱需為 2 到 80 個字。',
    INVITE_CODE_INVALID: '邀請碼需為 6 到 10 位英文字母或數字。',
    INVITE_CODE_CONFLICT: '邀請碼剛好重複，請重新建立一次。',
    GROUP_REQUEST_TIMEOUT: '雲端回應逾時，請確認網路後重試。',
    NOT_AUTHENTICATED: '登入狀態已失效，請重新登入。',
    GROUP_REQUEST_FAILED: '雲端小隊暫時無法使用，請稍後重試。',
  }
  return messages[code] || messages.GROUP_REQUEST_FAILED
}

export function normalizeInviteCode(value) {
  const normalized = String(value || '').replace(/\s+/g, '').toUpperCase()
  return INVITE_CODE_PATTERN.test(normalized) ? normalized : ''
}

export function generateInviteCode(cryptoApi = globalThis.crypto) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  return [...bytes].map((value) => alphabet[value % alphabet.length]).join('')
}

const withTimeout = async (operation, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  let timer
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new StudyGroupError('GROUP_REQUEST_TIMEOUT')), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

const requireClient = (client) => {
  if (!client) throw new StudyGroupError('GROUP_CLIENT_UNAVAILABLE')
}

const unwrapRpcData = (data) => (Array.isArray(data) ? data[0] : data) || {}

const callRpc = async (client, name, params, timeoutMs) => {
  requireClient(client)
  let response
  try {
    response = await withTimeout(client.rpc(name, params), timeoutMs)
  } catch (error) {
    if (error instanceof StudyGroupError) throw error
    throw new StudyGroupError('GROUP_REQUEST_FAILED')
  }
  if (response?.error) {
    const code = String(response.error.code || '')
    if (code === '28000' || code === 'PGRST301') throw new StudyGroupError('NOT_AUTHENTICATED')
    throw new StudyGroupError('GROUP_REQUEST_FAILED')
  }
  return unwrapRpcData(response?.data)
}

export async function createStudyGroup(client, groupName, inviteCode, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const name = typeof groupName === 'string' ? groupName.trim() : ''
  const normalizedCode = normalizeInviteCode(inviteCode)
  if (name.length < 2 || name.length > 80) throw new StudyGroupError('GROUP_NAME_INVALID')
  if (!normalizedCode) throw new StudyGroupError('INVITE_CODE_INVALID')

  const data = await callRpc(client, 'create_study_group', {
    p_name: name,
    p_invite_code: normalizedCode,
  }, timeoutMs)
  if (data.status === 'invite_code_conflict') throw new StudyGroupError('INVITE_CODE_CONFLICT')
  const groupId = data.group_id || data.id
  if (!groupId) throw new StudyGroupError('GROUP_REQUEST_FAILED')
  return { status: data.status || 'created', groupId, inviteCode: data.invite_code || normalizedCode }
}

export async function joinStudyGroup(client, inviteCode, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const normalizedCode = normalizeInviteCode(inviteCode)
  if (!normalizedCode) throw new StudyGroupError('INVITE_CODE_INVALID')
  const data = await callRpc(client, 'join_study_group_by_invite_code', {
    p_invite_code: normalizedCode,
  }, timeoutMs)
  return { status: data.status || 'failed', groupId: data.group_id || null }
}

export async function fetchStudyGroups(client, userId, timeoutMs = DEFAULT_TIMEOUT_MS) {
  requireClient(client)
  if (!userId) throw new StudyGroupError('NOT_AUTHENTICATED')
  let response
  try {
    response = await withTimeout(
      client.from('group_members').select(`
        group_id,
        role,
        study_groups (id, name, invite_code, owner_id)
      `).eq('user_id', userId),
      timeoutMs,
    )
  } catch (error) {
    if (error instanceof StudyGroupError) throw error
    throw new StudyGroupError('GROUP_REQUEST_FAILED')
  }
  if (response?.error) throw new StudyGroupError('GROUP_REQUEST_FAILED')

  const groups = (response?.data || []).flatMap((membership) => {
    const related = Array.isArray(membership.study_groups)
      ? membership.study_groups[0]
      : membership.study_groups
    return related ? [{
      id: related.id,
      name: related.name,
      invite_code: related.invite_code,
      owner_id: related.owner_id,
      myRole: membership.role || 'member',
      memberCount: 0,
    }] : []
  })

  return Promise.all(groups.map(async (group) => {
    try {
      const countResponse = await withTimeout(
        client.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', group.id),
        timeoutMs,
      )
      return { ...group, memberCount: countResponse?.error ? 0 : Number(countResponse?.count || 0) }
    } catch {
      return group
    }
  }))
}

export async function fetchStudyGroupLeaderboard(client, groupId, sortBy, timeoutMs = DEFAULT_TIMEOUT_MS) {
  requireClient(client)
  try {
    const membersResponse = await withTimeout(
      client.from('group_members').select('user_id, display_name, role').eq('group_id', groupId),
      timeoutMs,
    )
    if (membersResponse?.error) throw new StudyGroupError('GROUP_REQUEST_FAILED')
    const members = membersResponse?.data || []
    if (!members.length) return []

    const statsResponse = await withTimeout(
      client.from('user_public_stats')
        .select('user_id, display_name, streak_days, today_completion_rate, total_questions_answered, total_wrong_count, mock_high_score, updated_at')
        .in('user_id', members.map((member) => member.user_id)),
      timeoutMs,
    )
    if (statsResponse?.error) throw new StudyGroupError('GROUP_REQUEST_FAILED')
    const statsByUser = new Map((statsResponse?.data || []).map((item) => [item.user_id, item]))
    return members.map((member) => ({
      streak_days: 0,
      today_completion_rate: 0,
      total_questions_answered: 0,
      total_wrong_count: 0,
      mock_high_score: 0,
      updated_at: null,
      ...(statsByUser.get(member.user_id) || {}),
      user_id: member.user_id,
      display_name: member.display_name || statsByUser.get(member.user_id)?.display_name || '匿名戰友',
      role: member.role || 'member',
    })).sort((first, second) => Number(second[sortBy] || 0) - Number(first[sortBy] || 0))
  } catch (error) {
    if (error instanceof StudyGroupError) throw error
    throw new StudyGroupError('GROUP_REQUEST_FAILED')
  }
}