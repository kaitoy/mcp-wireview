import { useEffect, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import ResponseSection from './components/ResponseSection';
import EventList from './components/EventList';
import ErrorBlock from './components/ErrorBlock';
import { vscodeTheme } from './theme/jsonTreeTheme';
import { ResponseData } from './types';

function App() {
  const [data, setData] = useState<ResponseData | null>(null);

  useEffect(() => {
    // Read initial data from meta tag (CSP-safe approach)
    const metaTag = document.getElementById('vscode-initial-data') as HTMLMetaElement;
    if (metaTag) {
      const encodedData = metaTag.getAttribute('data-initial-data');
      if (encodedData) {
        try {
          const decodedData = atob(encodedData);
          const initialData = JSON.parse(decodedData);
          setData(initialData);
        } catch (error) {
          console.error('Failed to parse initial data:', error);
        }
      }
    }

    // Listen for updates from extension (future enhancement)
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'update') {
        setData(message.data);
      }
    });
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <h1>{data.title}</h1>

      {data.request && (
        <ResponseSection title="Request">
          <JSONTree
            data={data.request}
            theme={vscodeTheme}
            invertTheme={false}
            hideRoot={false}
          />
        </ResponseSection>
      )}

      {data.events && data.events.length > 0 && (
        <ResponseSection title="Events (SSE Stream)">
          <div className="events-summary">
            Total: {data.eventCount || data.events.length} events
          </div>
          <EventList events={data.events} />
        </ResponseSection>
      )}

      {data.isError ? (
        <ErrorBlock message={String(data.response)} />
      ) : data.response ? (
        <ResponseSection title="Final Response" isError={data.isError}>
          <JSONTree
            data={data.response}
            theme={vscodeTheme}
            invertTheme={false}
            hideRoot={false}
          />
        </ResponseSection>
      ) : null}
    </div>
  );
}

export default App;
