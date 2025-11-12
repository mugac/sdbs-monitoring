function SystemEventsTable({ events }) {
  if (!events || events.length === 0) {
    return <p className="no-data">No system events</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Total Waits</th>
            <th>Time (ms)</th>
            <th>Avg (ms)</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={index}>
              <td className="event-name">{event.event}</td>
              <td className="event-count">{event.total_waits.toLocaleString()}</td>
              <td className="event-time">{(event.time_waited * 10).toFixed(2)}</td>
              <td className="event-avg">{(event.avg_wait * 10).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SystemEventsTable;
