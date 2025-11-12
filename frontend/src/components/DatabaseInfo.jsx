function DatabaseInfo({ dbInfo, timestamp }) {
  if (!dbInfo) return null;

  return (
    <div className="database-info-bar">
      <div className="db-info-item">
        <span className="db-info-label">Database:</span>
        <span className="db-info-value">{dbInfo.name}</span>
      </div>
      <div className="db-info-item">
        <span className="db-info-label">Mode:</span>
        <span className="db-info-value">{dbInfo.open_mode}</span>
      </div>
      <div className="db-info-item">
        <span className="db-info-label">Log Mode:</span>
        <span className="db-info-value">{dbInfo.log_mode}</span>
      </div>
    </div>
  );
}

export default DatabaseInfo;
