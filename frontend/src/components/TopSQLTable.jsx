function TopSQLTable({ sqlData }) {
  if (!sqlData || sqlData.length === 0) {
    return <p className="no-data">No SQL queries</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table sql-table">
        <thead>
          <tr>
            <th>SQL ID</th>
            <th>Executions</th>
            <th>CPU (sec)</th>
            <th>Elapsed (sec)</th>
            <th>Disk Reads</th>
            <th>Buffer Gets</th>
            <th>SQL Text</th>
          </tr>
        </thead>
        <tbody>
          {sqlData.map((sql, index) => (
            <tr key={index}>
              <td className="sql-id">{sql.sql_id}</td>
              <td className="sql-executions">{sql.executions}</td>
              <td className="sql-cpu">{sql.cpu_sec}</td>
              <td className="sql-elapsed">{sql.elapsed_sec}</td>
              <td className="sql-reads">{sql.disk_reads?.toLocaleString()}</td>
              <td className="sql-buffers">{sql.buffer_gets?.toLocaleString()}</td>
              <td className="sql-text">
                <code>{sql.text}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TopSQLTable;
