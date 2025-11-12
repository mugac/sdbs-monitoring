function TablespacesTable({ tablespaces }) {
  if (!tablespaces || tablespaces.length === 0) {
    return <p className="no-data">No tablespace data</p>;
  }

  const getUsageClass = (pct) => {
    if (pct >= 90) return 'usage-critical';
    if (pct >= 80) return 'usage-warning';
    return 'usage-ok';
  };

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Tablespace</th>
            <th>Used %</th>
            <th>Used (MB)</th>
            <th>Total (MB)</th>
          </tr>
        </thead>
        <tbody>
          {tablespaces.map((ts, index) => (
            <tr key={index}>
              <td className="tablespace-name">{ts.name}</td>
              <td className={getUsageClass(ts.pct_used)}>
                <div className="usage-bar-container">
                  <div 
                    className={`usage-bar ${getUsageClass(ts.pct_used)}`}
                    style={{ width: `${ts.pct_used}%` }}
                  ></div>
                  <span className="usage-text">{ts.pct_used}%</span>
                </div>
              </td>
              <td className="tablespace-size">{ts.used_mb.toFixed(2)}</td>
              <td className="tablespace-size">{ts.total_mb.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablespacesTable;
