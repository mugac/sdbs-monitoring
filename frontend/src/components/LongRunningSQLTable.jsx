function LongRunningSQLTable({ sqlData }) {
  if (!sqlData || sqlData.length === 0) {
    return <p className="no-data">No long running queries</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table sql-table">
        <thead>
          <tr>
            <th>SQL ID</th>
            <th>Start Time</th>
            <th>Elapsed (sec)</th>
            <th>CPU (sec)</th>
            <th>Buffer Gets</th>
            <th>Disk Reads</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sqlData.map((sql, index) => (
            <tr key={index} className="warning-row">
              <td className="sql-id">{sql.sql_id}</td>
              <td className="sql-time">{sql.start_time ? new Date(sql.start_time).toLocaleTimeString() : 'N/A'}</td>
              <td className="sql-elapsed">{sql.elapsed_sec}</td>
              <td className="sql-cpu">{sql.cpu_sec}</td>
              <td className="sql-buffers">{sql.buffer_gets?.toLocaleString()}</td>
              <td className="sql-reads">{sql.disk_reads?.toLocaleString()}</td>
              <td className="sql-status">
                <span className="status-executing">{sql.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LongRunningSQLTable;
