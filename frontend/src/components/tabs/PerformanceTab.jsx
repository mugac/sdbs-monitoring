import SystemEventsTable from '../SystemEventsTable';
import LongRunningSQLTable from '../LongRunningSQLTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PerformanceTab({ metrics }) {
  // Prepare data for system events chart
  const systemEventsData = metrics.system_events.slice(0, 8).map(event => ({
    name: event.event.substring(0, 25),
    'Time (ms)': parseFloat((event.time_waited * 10).toFixed(2)),
    'Avg (ms)': parseFloat((event.avg_wait * 10).toFixed(2))
  }));

  return (
    <div className="tab-grid">
      {/* System Events Chart */}
      <div className="dashboard-card full-width chart-card">
        <h2>System-Wide Wait Events</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={systemEventsData}
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
            <Bar dataKey="Time (ms)" fill="#3b82f6" />
            <Bar dataKey="Avg (ms)" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* System Events Table */}
      <div className="dashboard-card full-width">
        <h2>System Events Details</h2>
        <SystemEventsTable events={metrics.system_events} />
      </div>

      {/* Long Running SQL */}
      {metrics.long_running_sql && metrics.long_running_sql.length > 0 && (
        <div className="dashboard-card full-width">
          <h2>Long Running Queries</h2>
          <LongRunningSQLTable sqlData={metrics.long_running_sql} />
        </div>
      )}
    </div>
  );
}

export default PerformanceTab;
