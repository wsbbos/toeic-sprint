// src/pages/Friends.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function Friends({ currentUser, currentSession }) {
  // Joined Groups States
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState(null);

  // Leaderboard States
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [sortBy, setSortBy] = useState('today_completion_rate'); // today_completion_rate | streak_days | total_questions_answered | mock_high_score

  // Form States
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState('');
  const [createdGroupName, setCreatedGroupName] = useState('');
  const [createdGroupId, setCreatedGroupId] = useState('');

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  const getStoredSupabaseAccessToken = () => {
    try {
      const authKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
      if (!authKey) return '';

      const storedAuth = JSON.parse(localStorage.getItem(authKey) || '{}');
      return storedAuth?.access_token
        || storedAuth?.currentSession?.access_token
        || storedAuth?.session?.access_token
        || '';
    } catch (err) {
      console.warn('Error reading localStorage token:', err);
      return '';
    }
  };

  // Query study groups user belongs to
  const fetchGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          study_groups (
            id,
            name,
            invite_code,
            owner_id
          )
        `)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error fetching joined groups:', error);
        alert('❌ 小隊列表讀取失敗，請重試！');
        setIsLoadingGroups(false);
        return;
      }

      if (!data || data.length === 0) {
        setGroups([]);
        setActiveGroupId(null);
        setIsLoadingGroups(false);
        return;
      }

      // Map joined groups and fetch their aggregate member counts
      const groupList = data
        .filter(m => m.study_groups) // safeguard
        .map(m => ({
          id: m.study_groups.id,
          name: m.study_groups.name,
          invite_code: m.study_groups.invite_code,
          owner_id: m.study_groups.owner_id,
          myRole: m.role || 'member',
          memberCount: 0
        }));

      for (let g of groupList) {
        const { count, error: countErr } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', g.id);
        
        if (!countErr) {
          g.memberCount = count || 0;
        }
      }

      setGroups(groupList);
      
      // Default to select first group if none active using functional updater to avoid dependency loop
      setActiveGroupId(prev => {
        if (!prev && groupList.length > 0) {
          return groupList[0].id;
        }
        return prev;
      });
    } catch (err) {
      console.error('Exception during groups fetch:', err);
      alert('❌ 小隊列表讀取失敗，請重試！');
    } finally {
      setIsLoadingGroups(false);
    }
  }, [currentUser.id]);

  // Query active group leaderboard stats from user_public_stats
  const fetchLeaderboard = useCallback(async (groupId) => {
    setLoadingLeaderboard(true);
    try {
      // 1. Fetch group members
      const { data: members, error: membersErr } = await supabase
        .from('group_members')
        .select('user_id, display_name, role')
        .eq('group_id', groupId);

      if (membersErr) {
        console.error('Error fetching group members:', membersErr);
        setLoadingLeaderboard(false);
        return;
      }

      if (!members || members.length === 0) {
        setGroupMembers([]);
        setLoadingLeaderboard(false);
        return;
      }

      // 2. Fetch public stats for those member IDs
      const memberIds = members.map(m => m.user_id);
      const { data: stats, error: statsErr } = await supabase
        .from('user_public_stats')
        .select('user_id, display_name, streak_days, today_completion_rate, total_questions_answered, total_wrong_count, mock_high_score, updated_at')
        .in('user_id', memberIds);

      if (statsErr) {
        console.error('Error fetching public stats:', statsErr);
      }

      // 3. Combine statistics
      const combined = members.map(m => {
        const userStats = stats?.find(s => s.user_id === m.user_id) || {
          streak_days: 0,
          today_completion_rate: 0,
          total_questions_answered: 0,
          total_wrong_count: 0,
          mock_high_score: 0,
          updated_at: null
        };

        return {
          user_id: m.user_id,
          display_name: m.display_name || userStats.display_name || '匿名戰友',
          role: m.role || 'member',
          ...userStats
        };
      });

      // 4. Sort dynamically
      const sorted = [...combined].sort((a, b) => {
        const valA = Number(a[sortBy]) || 0;
        const valB = Number(b[sortBy]) || 0;
        return valB - valA; // Descending
      });

      setGroupMembers(sorted);
    } catch (err) {
      console.error('Exception during leaderboard fetch:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [sortBy]);

  // Load Groups on Mount
  useEffect(() => {
    Promise.resolve().then(() => {
      setIsCreatingGroup(false); // Safeguard: Force reset to prevent stale state loading locks on mount
      if (currentUser) {
        fetchGroups();
      }
    });
  }, [currentUser, fetchGroups]);

  // Load Leaderboard when Active Group or Sorting changes
  useEffect(() => {
    if (activeGroupId) {
      Promise.resolve().then(() => {
        fetchLeaderboard(activeGroupId);
      });
    } else {
      Promise.resolve().then(() => {
        setGroupMembers([]);
      });
    }
  }, [activeGroupId, sortBy, fetchLeaderboard]);

  // Create new study group
  const handleCreateGroup = async () => {
    console.log('REAL CREATE GROUP BUTTON HANDLER FIRED')

    if (!currentUser) {
      alert('請先登入')
      return;
    }

    if (!supabase) {
      alert('Supabase 尚未初始化')
      return;
    }

    const groupName = newGroupName;
    if (groupName.trim().length < 2) {
      alert('小隊名稱至少需要 2 個字')
      return;
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    setIsCreatingGroup(true)

    console.log('STEP A: before getSession')

    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('GET_SESSION_TIMEOUT')), 8000)
        )
      ])

      console.log('STEP B: after getSession', sessionResult)

      const session = sessionResult?.data?.session

      if (!session?.access_token) {
        console.error('No access token found', sessionResult)
        alert('登入狀態失效，請重新登入')
        await supabase.auth.signOut()
        return
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const params = {
        p_name: groupName.trim(),
        p_invite_code: inviteCode
      }

      console.log('STEP C: raw fetch url', `${supabaseUrl}/rest/v1/rpc/create_study_group`)
      console.log('STEP D: raw fetch body', params)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_study_group`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(params),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        const text = await response.text()

        console.log('STEP E: raw fetch response status', response.status)
        console.log('STEP F: raw fetch response text', text)

        if (!response.ok) {
          alert('建立小隊失敗：' + text)
          return
        }

        let parsedData = null;
        try {
          parsedData = JSON.parse(text);
        } catch (parseErr) {
          console.warn('Response was not JSON:', parseErr);
        }
        const createdGroup = parsedData && parsedData[0] ? parsedData[0] : (parsedData || {});
        const createdId = createdGroup.id || createdGroup.group_id || (typeof createdGroup === 'string' ? createdGroup : null);

        setCreatedInviteCode(inviteCode);
        setCreatedGroupName(groupName.trim());
        setCreatedGroupId(createdId || JSON.stringify(createdGroup));
        setNewGroupName('');

        // Auto refresh the group list and select the newly created group
        await fetchGroups();
        if (createdId) {
          setActiveGroupId(createdId);
        }

        alert('建立成功，邀請碼：' + inviteCode);
      } catch (err) {
        clearTimeout(timeoutId)
        console.error('Raw fetch exception:', err)

        if (err.name === 'AbortError') {
          alert('RPC 請求逾時')
        } else {
          alert('建立小隊發生錯誤：' + err.message)
        }
      }
    } catch (sessionErr) {
      console.error('Session retrieval failed or timed out:', sessionErr)
      alert('無法取得使用者登入階段資訊：' + sessionErr.message)
    } finally {
      console.log('STEP G: finally reset loading')
      setIsCreatingGroup(false)
    }
  };

  // Join group by invite code
  const handleJoinGroup = async (e) => {
    e.preventDefault();
    const inviteCode = inviteCodeInput.trim().replace(/\s+/g, '').toUpperCase();

    console.log('JOIN STEP 1: handler fired');
    console.log('JOIN normalized invite code:', inviteCode);

    if (inviteCode.length < 6) {
      alert('請輸入 6 位邀請碼');
      return;
    }

    setIsJoiningGroup(true);

    try {
      // Do not call supabase.auth.getSession() here; it can hang in stale auth states.
      const accessToken = currentSession?.access_token || getStoredSupabaseAccessToken();
      console.log('JOIN STEP 3: has accessToken =', Boolean(accessToken));

      if (!accessToken) {
        alert('登入狀態失效，請重新登入');
        return;
      }

      console.log('JOIN query table:', 'study_groups');
      console.log('JOIN query field:', 'invite_code');

      const knownGroup = groups.find(group => group.invite_code?.toUpperCase() === inviteCode);
      const { data: inviteMatches, error: groupError } = knownGroup
        ? { data: [knownGroup], error: null }
        : await supabase
          .from('study_groups')
          .select('id, name, invite_code, owner_id')
          .eq('invite_code', inviteCode);

      console.log('JOIN query result count:', inviteMatches?.length || 0);
      console.log('JOIN error message:', groupError?.message || '');

      if (groupError) {
        alert('加入小隊發生錯誤：' + groupError.message);
        return;
      }

      if (!inviteMatches || inviteMatches.length === 0) {
        alert('找不到此邀請碼');
        return;
      }

      const targetGroup = inviteMatches[0];
      const { data: existingMembers, error: memberCheckError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('group_id', targetGroup.id)
        .eq('user_id', currentUser.id);

      console.log('JOIN query table:', 'group_members');
      console.log('JOIN query result count:', existingMembers?.length || 0);
      console.log('JOIN error message:', memberCheckError?.message || '');

      if (memberCheckError) {
        alert('加入小隊發生錯誤：' + memberCheckError.message);
        return;
      }

      if (existingMembers && existingMembers.length > 0) {
        alert('你已經在這個小隊');
        setActiveGroupId(targetGroup.id);
        await fetchLeaderboard(targetGroup.id);
        return;
      }

      const { error: insertError } = await supabase
        .from('group_members')
        .insert({
          group_id: targetGroup.id,
          user_id: currentUser.id,
          display_name: currentUser.username || currentUser.email?.split('@')[0] || '匿名戰友',
          role: 'member'
        });

      console.log('JOIN query table:', 'group_members');
      console.log('JOIN query result count:', insertError ? 0 : 1);
      console.log('JOIN error message:', insertError?.message || '');

      if (insertError) {
        const errorText = [
          insertError.code,
          insertError.message,
          insertError.details,
          insertError.hint
        ].filter(Boolean).join(' ').toLowerCase();

        if (
          errorText.includes('already')
          || errorText.includes('duplicate')
          || errorText.includes('unique')
          || errorText.includes('member')
          || errorText.includes('23505')
        ) {
          alert('你已經在這個小隊');
          setActiveGroupId(targetGroup.id);
          await fetchLeaderboard(targetGroup.id);
          return;
        }

        alert('加入小隊發生錯誤：' + insertError.message);
        return;
      }

      alert('🎉 成功加入讀書小隊！');
      setInviteCodeInput('');

      // Refresh list and select group leaderboard
      try {
        await fetchGroups();
        setActiveGroupId(targetGroup.id);
        await fetchLeaderboard(targetGroup.id);
      } catch (refreshErr) {
        console.error('List refresh failed after joining:', refreshErr);
        alert('加入成功，但列表刷新失敗，請重新整理');
      }

    } catch (err) {
      console.error('Join group exception:', err);
      alert('加入小隊發生錯誤：' + err.message);
    } finally {
      setIsJoiningGroup(false);
    }
  };
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`📋 邀請碼「${code}」已複製至剪貼簿！`);
  };

  if (!currentUser) return null;

  // Extract active user statistics safely
  const streak = currentUser.progress?.streakDays || 0;
  const totalAnswered = currentUser.progress?.totalQuestionsAnswered || 0;

  const mockTestHistory = currentUser.mockTestHistory || [];
  const mockHighScore = mockTestHistory.length > 0
    ? Math.max(...mockTestHistory.map(h => h.score))
    : 0;

  // Calculate today's record numbers
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = currentUser.dailyRecords?.find(r => r.date === todayStr) || {
    wordsLearned: 0,
    questionsAnswered: 0,
    studyMinutes: 0
  };

  const wordsGoal = currentUser.goals?.dailyVocabularyGoal || 30;
  const questionsGoal = currentUser.goals?.dailyQuestionGoal || 50;
  const studyGoal = currentUser.goals?.dailyStudyMinutesGoal || 60;

  const wP = Math.min((todayRecord.wordsLearned / wordsGoal) * 100, 100);
  const qP = Math.min((todayRecord.questionsAnswered / questionsGoal) * 100, 100);
  const sP = Math.min((todayRecord.studyMinutes / studyGoal) * 100, 100);
  const completionRate = Math.round((wP + qP + sP) / 3);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <div className="flex flex-col gap-3 practice-container" style={{ maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Cloud Profile Header Summary */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>
              👤 我的雲端學習摘要 (My Cloud Profile)
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>信箱: {currentUser.email}</span>
          </div>
          <span className="badge badge-success">雲端連線正常</span>
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
              <label className="form-label">小隊名稱</label>
              <input
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
              type="button"
              onClick={handleCreateGroup}
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
              <label className="form-label">輸入小隊邀請碼</label>
              <input
                type="text"
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
                <div
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  className="card"
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: isActive ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                    backgroundColor: isActive ? 'var(--secondary-light)' : '#ffffff',
                    position: 'relative',
                    overflow: 'hidden'
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                    <span>邀請碼: <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{g.invite_code}</strong></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(g.invite_code);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                    >
                      複製
                    </button>
                  </div>
                </div>
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
                同舟共濟，即時查看隊友真實進度（每小時更新）
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-sub)' }}>排序依據：</span>
              <select
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
