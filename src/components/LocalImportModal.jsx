export default function LocalImportModal({
  users,
  selectedUserId,
  onSelectedUserChange,
  onImport,
  onDismiss,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="card modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="local-import-title"
      >
        <h2 id="local-import-title">📦 匯入本機學習資料</h2>
        <p>
          偵測到這個瀏覽器有舊版學習紀錄。您可以將選取的紀錄合併到目前帳號，
          或略過並繼續使用雲端資料。
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="legacy-user-select">選擇要匯入的本機使用者</label>
          <select
            id="legacy-user-select"
            className="form-input"
            value={selectedUserId}
            onChange={(event) => onSelectedUserChange(event.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}（目標 {user.goals?.targetScore || 700} 分）
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => onImport(selectedUserId)}>
            匯入並同步
          </button>
          <button className="btn btn-outline" onClick={onDismiss}>
            略過
          </button>
        </div>
      </section>
    </div>
  );
}
