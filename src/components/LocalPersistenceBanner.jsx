export default function LocalPersistenceBanner({ status }) {
  if (status !== 'failed') return null

  return (
    <div className="offline-notice" role="alert" aria-live="assertive">
      本機儲存失敗：目前進度可能在關閉或重新整理後遺失。請保留此頁面，並確認瀏覽器儲存空間與隱私設定。
    </div>
  )
}
