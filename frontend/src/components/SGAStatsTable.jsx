function SGAStatsTable({ sgaData }) {
  if (!sgaData || sgaData.length === 0) {
    return <p className="no-data">No SGA data</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Komponenta</th>
            <th>Velikost (MB)</th>
          </tr>
        </thead>
        <tbody>
          {sgaData.map((component, index) => (
            <tr key={index}>
              <td className="component-name">{component.component}</td>
              <td className="component-size">{component.size_mb.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SGAStatsTable;
