import { useCallback, useEffect, useState } from 'react'
import EmptyLearningState from '../components/visuals/EmptyLearningState.jsx'
import { supabase } from '../lib/supabase'
import {
  createStudyGroup,
  fetchStudyGroupLeaderboard,
  fetchStudyGroups,
  generateInviteCode,
  getStudyGroupErrorMessage,
  joinStudyGroup,
  normalizeInviteCode,
} from '../services/studyGroupService.js'

export default function Friends({ currentUser }) {
  const [groups, setGroups] = useState([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [activeGroupId, setActiveGroupId] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [sortBy, setSortBy] = useState('today_completion_rate')
  const [newGroupName, setNewGroupName] = useState('')
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [createdInviteCode, setCreatedInviteCode] = useState('')
  const [createdGroupName, setCreatedGroupName] = useState('')
  const [createdGroupId, setCreatedGroupId] = useState('')
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [isJoiningGroup, setIsJoiningGroup] = useState(false)
  const [pageError, setPageError] = useState('')

  const currentUserId = currentUser?.id || ''
  const cloudAvailable = Boolean(supabase && currentUserId && !currentUser?.isGuest)

  const fetchGroups = useCallback(async () => {
    if (!cloudAvailable) return []
    setIsLoadingGroups(true)
    try {
      const groupList = await fetchStudyGroups(supabase, currentUserId)
      setGroups(groupList)
      setActiveGroupId((previous) => (
        groupList.some((group) => group.id === previous) ? previous : groupList[0]?.id || null
      ))
      setPageError('')
      return groupList
    } catch (error) {
      setPageError(getStudyGroupErrorMessage(error))
      return []
    } finally {
      setIsLoadingGroups(false)
    }
  }, [cloudAvailable, currentUserId])

  const fetchLeaderboard = useCallback(async (groupId) => {
    if (!cloudAvailable || !groupId) return
    setLoadingLeaderboard(true)
    try {
      setGroupMembers(await fetchStudyGroupLeaderboard(supabase, groupId, sortBy))
      setPageError('')
    } catch (error) {
      setGroupMembers([])
      setPageError(getStudyGroupErrorMessage(error))
    } finally {
      setLoadingLeaderboard(false)
    }
  }, [cloudAvailable, sortBy])

  useEffect(() => {
    if (!cloudAvailable) return undefined
    let active = true
    Promise.resolve().then(() => {
      if (active) fetchGroups()
    })
    return () => { active = false }
  }, [cloudAvailable, fetchGroups])

  useEffect(() => {
    if (!cloudAvailable || !activeGroupId) return undefined
    let active = true
    Promise.resolve().then(() => {
      if (active) fetchLeaderboard(activeGroupId)
    })
    return () => { active = false }
  }, [activeGroupId, cloudAvailable, fetchLeaderboard])

  const handleCreateGroup = async () => {
    setIsCreatingGroup(true)
    setPageError('')
    try {
      const inviteCode = generateInviteCode()
      const created = await createStudyGroup(supabase, newGroupName, inviteCode)
      setCreatedInviteCode(created.inviteCode)
      setCreatedGroupName(newGroupName.trim())
      setCreatedGroupId(created.groupId)
      setNewGroupName('')
      await fetchGroups()
      setActiveGroupId(created.groupId)
      window.alert(`建立成功，邀請碼：${created.inviteCode}`)
    } catch (error) {
      const message = getStudyGroupErrorMessage(error)
      setPageError(message)
      window.alert(message)
    } finally {
      setIsCreatingGroup(false)
    }
  }

  const handleJoinGroup = async (event) => {
    event.preventDefault()
    const inviteCode = normalizeInviteCode(inviteCodeInput)
    const knownGroup = groups.find((group) => group.invite_code?.toUpperCase() === inviteCode)
    if (knownGroup) {
      setActiveGroupId(knownGroup.id)
      await fetchLeaderboard(knownGroup.id)
      window.alert('你已經在這個小隊')
      return
    }

    setIsJoiningGroup(true)
    setPageError('')
    try {
      const result = await joinStudyGroup(supabase, inviteCode)
      if (result.status === 'not_found') {
        window.alert('找不到此邀請碼')
        return
      }
      if (!['joined', 'already_member'].includes(result.status)) {
        throw new Error('Unexpected study-group response')
      }
      setInviteCodeInput('')
      await fetchGroups()
      if (result.groupId) {
        setActiveGroupId(result.groupId)
        await fetchLeaderboard(result.groupId)
      }
      window.alert(result.status === 'joined' ? '🎉 成功加入讀書小隊！' : '你已經在這個小隊')
    } catch (error) {
      const message = getStudyGroupErrorMessage(error)
      setPageError(message)
      window.alert(message)
    } finally {
      setIsJoiningGroup(false)
    }
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      window.alert(`📋 邀請碼「${code}」已複製至剪貼簿！`)
    } catch {
      setPageError('無法存取剪貼簿，請手動複製邀請碼。')
    }
  }

  if (!cloudAvailable) {
    return (
      <EmptyLearningState
        variant="empty"
        title="登入後使用讀書小隊"
        description={currentUser?.isGuest
          ? '訪客模式的核心練習仍可完整使用；讀書小隊需要登入，才能依 RLS 安全讀取成員資料。'
          : '目前未設定 Supabase，請先完成公開環境變數與資料庫 migration。'}
      />
    )
  }

  const streak = Number(currentUser.progress?.streakDays || 0)
  const totalAnswered = Number(currentUser.progress?.totalQuestionsAnswered || 0)
  const mockScores = (currentUser.mockTestHistory || []).map((history) => Number(history.score)).filter(Number.isFinite)
  const mockHighScore = mockScores.length ? Math.max(...mockScores) : 0
  const todayStr = new Date().toISOString().split('T')[0]
  const todayRecord = currentUser.dailyRecords?.find((record) => record.date === todayStr) || {
    wordsLearned: 0,
    questionsAnswered: 0,
    studyMinutes: 0,
  }
  const wordsGoal = Number(currentUser.goals?.dailyVocabularyGoal || 30)
  const questionsGoal = Number(currentUser.goals?.dailyQuestionGoal || 30)
  const studyGoal = Number(currentUser.goals?.dailyStudyMinutesGoal || 45)
  const wP = Math.min((Number(todayRecord.wordsLearned || 0) / wordsGoal) * 100, 100)
  const qP = Math.min((Number(todayRecord.questionsAnswered || 0) / questionsGoal) * 100, 100)
  const sP = Math.min((Number(todayRecord.studyMinutes || 0) / studyGoal) * 100, 100)
  const completionRate = Math.round((wP + qP + sP) / 3)
  const activeGroup = groups.find((group) => group.id === activeGroupId)
  return (
    <div className="flex flex-col gap-3 practice-container" style={{ maxWidth: '950px', margin: '0 auto' }}>
      {pageError && (
        <div className="card" role="alert" aria-live="assertive" style={{ padding: '1rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <strong>雲端小隊暫時無法更新</strong>
          <p style={{ margin: '0.35rem 0 0.75rem' }}>{pageError}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={fetchGroups}>重新載入</button>
        </div>
      )}

      {/* Cloud Profile Header Summary */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>
              👤 我的雲端學習摘要 (My Cloud Profile)
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>信箱: {currentUser.email}</span>
          </div>
          <span className="badge badge-new">登入帳號 · 雲端小隊</span>
        </div>

        <div className="grid grid-cols-4 gap-2" style={{ marginBottom: '1rem' }}>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'hsl(220, 10%, 98%)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>連續學習</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>🔥 {streak} 天</div>
          </div>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'hsl(220, 10%, 98%)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>今日進度</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>🎯 {completionRate}%</div>
          </div>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'hsl(220, 10%, 98%)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>累積答題</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>✏️ {totalAnswered} 題</div>
          </div>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'hsl(220, 10%, 98%)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>模擬考最高分</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.25rem' }}>🏆 {mockHighScore > 0 ? `${mockHighScore}分` : '尚未測驗'}</div>
          </div>
        </div>
      </div>

      {/* Group Management Dashboard (Create / Join Panel) */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Create Group Panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👑 建立讀書小隊
          </h3>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="study-group-name">小隊名稱</label>
              <input
                id="study-group-name"
                type="text"
                placeholder="例如：金色證書衝刺班 / TOEIC 每日打卡群"
                className="form-input"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                maxLength={30}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreatingGroup || !newGroupName.trim()}
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              {isCreatingGroup ? '🛠️ 建立中...' : '建立小隊'}
            </button>
          </form>

          {createdInviteCode && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'hsl(140, 30%, 96%)',
              border: '1px dashed hsl(140, 50%, 50%)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'hsl(140, 50%, 30%)', display: 'block', fontWeight: 600 }}>
                🎉 小隊「{createdGroupName}」建立成功！
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'hsl(140, 50%, 25%)', margin: '0.25rem 0', letterSpacing: '2px' }}>
                {createdInviteCode}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: '0.25rem 0' }}>
                ID: {createdGroupId}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'block', marginBottom: '0.5rem' }}>
                請分享此邀請碼給朋友，讓他們加入您的小隊。
              </span>
              <button
                onClick={() => handleCopyCode(createdInviteCode)}
                className="btn btn-outline btn-sm"
                style={{ backgroundColor: '#ffffff' }}
              >
                📋 複製邀請碼
              </button>
            </div>
          )}
        </div>

        {/* Join Group Panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👥 加入已建立的小隊
          </h3>
          <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="study-group-invite">輸入小隊邀請碼</label>
              <input
                id="study-group-invite"
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="輸入 6 位英文/數字邀請碼"
                className="form-input"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                maxLength={10}
                required
                style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isJoiningGroup || !inviteCodeInput.trim()}
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              {isJoiningGroup ? '🏃 加入中...' : '加入小隊'}
            </button>
          </form>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '0.75rem', lineHeight: '1.4' }}>
            💡 加入讀書小隊後，您可以隨時在排行榜中看到隊友真實的學習統計數據與進度。
          </div>
        </div>

      </div>

      {/* My Joined Groups List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
          🏢 我的小隊列表
        </h3>

        {isLoadingGroups ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-sub)' }}>
            🔄 正在載入您的小隊列表...
          </div>
        ) : groups.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            color: 'var(--text-sub)',
            border: '1px dashed var(--border-color)',
            borderRadius: '12px',
            backgroundColor: '#fafafa'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🏚️</span>
            <strong>你尚未加入任何小隊。</strong>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              請在上方建立您的小隊，或是輸入朋友的邀請碼加入，開始跨裝置真實互相監督！
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {groups.map(g => {
              const isActive = g.id === activeGroupId;
              return (
                <article
                  key={g.id}
                  className="card"
                  style={{
                    padding: '1rem',
                    transition: 'all 0.2s',
                    border: isActive ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                    backgroundColor: isActive ? 'var(--secondary-light)' : '#ffffff',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    type="button"
                    tabIndex={0}
                    aria-label={`選擇小隊 ${g.name}`}
                    aria-pressed={isActive}
                    onClick={() => setActiveGroupId(g.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      color: 'inherit',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      color: g.myRole === 'owner' ? '#b45309' : '#047857',
                      backgroundColor: g.myRole === 'owner' ? '#fef3c7' : '#d1fae5'
                    }}>
                      {g.myRole === 'owner' ? '👑 隊長' : '👤 隊員'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>
                      👥 {g.memberCount} 人
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.name}
                  </h4>
                  </button>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                    <span>邀請碼: <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{g.invite_code}</strong></span>
                    <button
                      type="button"
                      aria-label={`複製 ${g.name} 邀請碼`}
                      onClick={() => {
                        handleCopyCode(g.invite_code);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minWidth: '44px',
                        minHeight: '36px',
                        padding: '0.35rem 0.5rem'
                      }}
                    >
                      複製
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard Section */}
      {activeGroupId && activeGroup && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid var(--border-color)', 
            paddingBottom: '0.75rem', 
            margin: '0 0 1rem 0' 
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>
                🏆 「{activeGroup.name}」好友排行榜
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                同舟共濟，查看隊友最近一次同步的學習進度
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
              <label htmlFor="group-leaderboard-sort" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>排序依據：</label>
              <select
                id="group-leaderboard-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="today_completion_rate">今日任務完成率 🎯</option>
                <option value="streak_days">連續學習天數 🔥</option>
                <option value="total_questions_answered">累積做題數量 ✏️</option>
                <option value="mock_high_score">模擬考最高分 🏆</option>
              </select>
            </div>
          </div>

          {loadingLeaderboard ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-sub)' }}>
              🔄 正在拉取小隊成員最新雲端數據...
            </div>
          ) : groupMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-light)' }}>
              沒有成員數據。
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>排名</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>隊友暱稱</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>今日進度 🎯</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>連續天數 🔥</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>總答題數 ✏️</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>錯題數 📓</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>模擬考最高分 🏆</th>
                  </tr>
                </thead>
                <tbody>
                  {groupMembers.map((member, index) => {
                    const isSelf = member.user_id === currentUser.id;
                    const rank = index + 1;
                    let rankBadge = `${rank}`;
                    if (rank === 1) rankBadge = '🥇';
                    else if (rank === 2) rankBadge = '🥈';
                    else if (rank === 3) rankBadge = '🥉';

                    return (
                      <tr
                        key={member.user_id}
                        style={{
                          borderBottom: '1px solid rgba(0,0,0,0.05)',
                          backgroundColor: isSelf ? 'hsl(220, 30%, 97%)' : 'transparent',
                          fontWeight: isSelf ? 700 : 'normal',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: rank <= 3 ? '1.25rem' : '0.9rem', textAlign: 'center', width: '60px' }}>
                          {rankBadge}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: isSelf ? 'var(--secondary)' : 'var(--text-main)' }}>
                          <span>{member.display_name}</span>
                          {member.role === 'owner' && (
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 4px', borderRadius: '4px' }}>
                              隊長
                            </span>
                          )}
                          {isSelf && (
                            <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--primary)', color: '#ffffff', padding: '1px 6px', borderRadius: '4px' }}>
                              你
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: sortBy === 'today_completion_rate' ? 800 : 'inherit', color: 'var(--primary)' }}>
                          {member.today_completion_rate}%
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: sortBy === 'streak_days' ? 800 : 'inherit', color: 'var(--warning)' }}>
                          {member.streak_days} 天
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: sortBy === 'total_questions_answered' ? 800 : 'inherit' }}>
                          {member.total_questions_answered} 題
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-light)' }}>
                          {member.total_wrong_count}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: sortBy === 'mock_high_score' ? 800 : 'inherit', color: member.mock_high_score > 0 ? 'var(--danger)' : 'var(--text-light)' }}>
                          {member.mock_high_score > 0 ? `${member.mock_high_score}分` : '尚未測驗'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
