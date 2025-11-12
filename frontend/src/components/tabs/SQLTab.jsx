import TopSQLTable from '../TopSQLTable';
import LongRunningSQLTable from '../LongRunningSQLTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

function SQLTab({ metrics }) {
  // Prepare data for top SQL chart
  const topSQLData = metrics.top_sql.slice(0, 10).map(sql => ({
    sql_id: sql.sql_id,
    'CPU (sec)': sql.cpu_sec,
    'Elapsed (sec)': sql.elapsed_sec,
    executions: sql.executions,
    'Disk Reads': sql.disk_reads
  }));

  // Prepare scatter plot data (CPU vs Executions)
  const scatterData = metrics.top_sql.slice(0, 15).map(sql => ({
    cpu: sql.cpu_sec,
    executions: sql.executions,
    sql_id: sql.sql_id,
    size: sql.buffer_gets / 1000
  }));

  return (
    <div className="tab-grid">
      {/* Top SQL Bar Chart */}
      <div className="dashboard-card full-width chart-card">
        <h2>Top SQL by CPU Time</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={topSQLData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="sql_id" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="CPU (sec)" fill="#3b82f6" />
            <Bar dataKey="Elapsed (sec)" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SQL Performance Scatter Plot */}
      <div className="dashboard-card chart-card">
        <h2>SQL Performance: CPU vs Executions</h2>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="cpu" 
              name="CPU Time" 
              unit=" sec"
              label={{ value: 'CPU Time (sec)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="executions" 
              name="Executions"
              label={{ value: 'Executions', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis type="number" dataKey="size" range={[50, 400]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="SQL Queries" data={scatterData} fill="#3b82f6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Long Running SQL */}
      {metrics.long_running_sql && metrics.long_running_sql.length > 0 && (
        <div className="dashboard-card full-width">
          <h2>Long Running Queries</h2>
          <LongRunningSQLTable sqlData={metrics.long_running_sql} />
        </div>
      )}

      {/* Top SQL Table */}
      <div className="dashboard-card full-width">
        <h2>Top SQL Queries Details</h2>
        <TopSQLTable sqlData={metrics.top_sql} />
      </div>
    </div>
  );
}

export default SQLTab;
