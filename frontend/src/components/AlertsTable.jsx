function AlertsTable({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return <p className="no-data">No recent alerts</p>;
  }

  const getLevelClass = (level) => {
    if (level === 1) return 'alert-critical';
    if (level === 2) return 'alert-warning';
    return 'alert-info';
  };

  const getLevelText = (level) => {
    if (level === 1) return 'Critical';
    if (level === 2) return 'Warning';
    return 'Info';
  };

  return (
    <div className="table-container">
      <table className="data-table alerts-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Level</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, index) => (
            <tr key={index} className={getLevelClass(alert.level)}>
              <td className="alert-time">
                {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'N/A'}
              </td>
              <td className="alert-level">
                <span className={`alert-badge ${getLevelClass(alert.level)}`}>
                  {getLevelText(alert.level)}
                </span>
              </td>
              <td className="alert-message">{alert.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AlertsTable;
