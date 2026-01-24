import { HTTPInfo } from '../types';

interface HeadersSectionProps {
  httpInfo: HTTPInfo;
}

export default function HeadersSection({ httpInfo }: HeadersSectionProps) {
  return (
    <div className="section">
      <div className="section-title">HTTP Headers</div>
      <div className="code-block">
        <div className="headers-container">
          <div className="headers-group">
            <h3 className="headers-subtitle">Request Headers</h3>
            <table className="headers-table">
              <thead>
                <tr>
                  <th>Header</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(httpInfo.requestHeaders).map(([key, value]) => (
                  <tr key={key}>
                    <td className="header-key">{key}</td>
                    <td className="header-value">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="headers-group">
            <h3 className="headers-subtitle">Response Headers</h3>
            <table className="headers-table">
              <thead>
                <tr>
                  <th>Header</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(httpInfo.responseHeaders).map(([key, value]) => (
                  <tr key={key}>
                    <td className="header-key">{key}</td>
                    <td className="header-value">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
