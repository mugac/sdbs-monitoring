import TablespacesTable from '../TablespacesTable';
import SGAStatsTable from '../SGAStatsTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function StorageTab({ metrics }) {
  // Prepare tablespace data for chart
  const tablespaceData = metrics.tablespaces.slice(0, 8).map(ts => ({
    name: ts.name,
    'Used (MB)': ts.used_mb,
    'Free (MB)': parseFloat((ts.total_mb - ts.used_mb).toFixed(2)),
    pct: ts.pct_used
  }));

  // Prepare SGA data for pie chart
  const sgaData = metrics.sga_stats.slice(0, 6).map(component => ({
    name: component.component.substring(0, 30),
    value: component.size_mb
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div className="tab-grid">
      {/* Tablespace Usage Chart */}
      <div className="dashboard-card full-width chart-card">
        <h2>Tablespace Usage</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={tablespaceData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Used (MB)" stackId="a" fill="#ef4444" />
            <Bar dataKey="Free (MB)" stackId="a" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SGA Components Chart */}
      <div className="dashboard-card chart-card">
        <h2>SGA Memory Distribution</h2>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={sgaData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value.toFixed(0)} MB`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {sgaData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tablespace Table */}
      <div className="dashboard-card">
        <h2>Tablespace Details</h2>
        <TablespacesTable tablespaces={metrics.tablespaces} />
      </div>

      {/* SGA Stats Table */}
      <div className="dashboard-card">
        <h2>SGA Components</h2>
        <SGAStatsTable sgaData={metrics.sga_stats} />
      </div>
    </div>
  );
}

export default StorageTab;
