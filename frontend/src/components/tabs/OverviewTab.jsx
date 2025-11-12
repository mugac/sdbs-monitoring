import SessionsCard from '../SessionsCard';
import WaitEventsTable from '../WaitEventsTable';
import AlertsTable from '../AlertsTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

function OverviewTab({ metrics }) {
  // Prepare data for wait events pie chart
  const waitEventsData = metrics.wait_events.slice(0, 5).map(event => ({
    name: event.event.substring(0, 30),
    value: event.count
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="tab-grid">
      {/* Sessions Card */}
      <SessionsCard 
        count={metrics.active_sessions} 
        total={metrics.total_sessions}
        timestamp={metrics.timestamp} 
      />

      {/* Wait Events Chart */}
      <div className="dashboard-card chart-card">
        <h2>Top Wait Events Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={waitEventsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {waitEventsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Wait Events Table */}
      <div className="dashboard-card">
        <h2>Current Wait Events</h2>
        <WaitEventsTable events={metrics.wait_events} />
      </div>

      {/* Alerts */}
      {metrics.alerts && metrics.alerts.length > 0 && (
        <div className="dashboard-card full-width alert-card">
          <h2>Recent Alerts</h2>
          <AlertsTable alerts={metrics.alerts} />
        </div>
      )}
    </div>
  );
}

export default OverviewTab;
