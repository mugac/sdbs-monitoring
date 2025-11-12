function SessionsCard({ count, total, timestamp }) {
  const getStatusClass = () => {
    if (count < 10) return 'status-ok';
    if (count < 20) return 'status-warning';
    return 'status-critical';
  };

  const getStatusText = () => {
    if (count < 10) return 'Normal';
    if (count < 20) return 'Elevated';
    return 'High Load';
  };

  return (
    <div className={`dashboard-card sessions-card ${getStatusClass()}`}>
      <h2>Active Sessions</h2>
      <div className="sessions-count">
        <span className="count-number">{count}</span>
        <span className="count-label">active</span>
      </div>
      <div className="sessions-total">
        <span className="total-label">Total Sessions:</span>
        <span className="total-number">{total}</span>
      </div>
      <div className="card-footer">
        <span className={`status-badge ${getStatusClass()}`}>
          <span className="status-indicator"></span>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
}

export default SessionsCard;
