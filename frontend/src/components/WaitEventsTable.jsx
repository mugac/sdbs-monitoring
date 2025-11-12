function WaitEventsTable({ events }) {
  if (!events || events.length === 0) {
    return <p className="no-data">No wait events</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Počet</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={index}>
              <td className="event-name">{event.event}</td>
              <td className="event-count">{event.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WaitEventsTable;
