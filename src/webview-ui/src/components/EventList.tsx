import { JSONTree } from 'react-json-tree';
import { vscodeTheme } from '../theme/jsonTreeTheme';
import { EventItemProps } from '../types';

interface EventListProps {
  events: Array<{ index: number; data: any }>;
}

export default function EventList({ events }: EventListProps) {
  return (
    <div id="events-container">
      {events.map((event) => (
        <EventItem key={event.index} index={event.index} data={event.data} />
      ))}
    </div>
  );
}

function EventItem({ index, data }: EventItemProps) {
  return (
    <div className="event-item">
      <div className="event-header">Event {index}</div>
      <div className="code-block">
        <JSONTree
          data={data}
          theme={vscodeTheme}
          invertTheme={false}
          hideRoot={false}
        />
      </div>
    </div>
  );
}
