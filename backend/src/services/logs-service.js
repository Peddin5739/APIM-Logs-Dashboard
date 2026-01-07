const { logsQueryClient } = require('../azure-client');
const discoveryService = require('../discovery-service');

let cachedWorkspaceId = null;

async function getAPIMLogs(startTime, endTime, localTelemetry = []) {
    // Define the list of raw logs to return
    let rawLogs = [];
    let stats = [];

    try {
        if (!cachedWorkspaceId) {
            cachedWorkspaceId = await discoveryService.findWorkspaceId();
        }
        const workspaceId = cachedWorkspaceId;

        // Build time filter
        let timeFilter = 'where TimeGenerated > ago(24h)';
        if (startTime && endTime) {
            timeFilter = `where TimeGenerated between (datetime(${startTime}) .. datetime(${endTime}))`;
        } else if (startTime) {
            timeFilter = `where TimeGenerated > datetime(${startTime})`;
        }

        // KQL for status distributions and time series
        const query = `
            AppRequests
            | ${timeFilter}
            | where Url contains "/quotes" or Url contains "/erebor" or Url contains "/elevate-mgu" or Url contains "/shrimagerightdocument" or Url contains "/kafka"
            | extend statusGroup = strcat(substring(tostring(ResultCode), 0, 1), "00")
            | summarize count = count() by bin(TimeGenerated, 1h), statusGroup
            | order by TimeGenerated desc
        `;

        // Query for raw logs for table and export
        const rawQuery = `
            AppRequests
            | ${timeFilter}
            | where Url contains "/quotes" or Url contains "/erebor" or Url contains "/elevate-mgu" or Url contains "/shrimagerightdocument" or Url contains "/kafka"
            | project timestamp = TimeGenerated, name = Name, success = Success, resultCode = ResultCode, duration = DurationMs, url = Url, method = Method
            | order by timestamp desc
            | limit 1000
        `;

        const [statsResult, rawResult] = await Promise.all([
            logsQueryClient.queryWorkspace(workspaceId, query),
            logsQueryClient.queryWorkspace(workspaceId, rawQuery)
        ]);

        rawLogs = processRaw(rawResult.tables[0]);
        stats = processStats(statsResult.tables[0]);

    } catch (err) {
        console.warn('Azure Query failed, falling back to local telemetry:', err.message);
    }

    // Merge with local telemetry and process
    let filteredLocal = localTelemetry;
    if (startTime || endTime) {
        const start = startTime ? new Date(startTime) : new Date(0);
        const end = endTime ? new Date(endTime) : new Date();
        filteredLocal = localTelemetry.filter(l => {
            const t = new Date(l.timestamp);
            return t >= start && t <= end;
        });
    }

    const processedLocal = processRawLogs(filteredLocal);
    const combinedRaw = [...processedLocal, ...rawLogs]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 1000);

    // If Azure stats are empty, generate them from the combined raw logs
    if (stats.length === 0 && combinedRaw.length > 0) {
        stats = generateMockStats(combinedRaw);
    }

    return {
        stats: stats,
        raw: combinedRaw
    };
}

// Helper to generate mock time-series stats from raw logs
function generateMockStats(logs) {
    const hourlyGroups = {};
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        date.setMinutes(0, 0, 0);
        const hour = date.toISOString();
        const statusGroup = (Math.floor(log.resultCode / 100) * 100).toString();

        const key = `${hour}_${statusGroup}`;
        if (!hourlyGroups[key]) {
            hourlyGroups[key] = {
                timestamp: hour,
                statusGroup: statusGroup,
                count: 0
            };
        }
        hourlyGroups[key].count++;
    });
    return Object.values(hourlyGroups).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Helper to process raw objects (local or azure) for API Family assignment
function processRawLogs(logs) {
    return logs.map(log => {
        const obj = { ...log };
        const url = obj.url || '';
        if (url.includes('/erebor/') || url.includes('/shrimagerightdocument/')) obj.apiFamily = 'Erebor';
        else if (url.includes('/elevate-mgu/')) obj.apiFamily = 'Elevate';
        else if (url.includes('/kafka/')) obj.apiFamily = 'Elevate Kafka';
        else obj.apiFamily = 'Other';
        return obj;
    });
}

function processStats(table) {
    if (!table) return [];
    const { columns, rows } = table;
    return rows.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col.name] = row[idx];
        });
        return obj;
    });
}

function processRaw(table) {
    if (!table) return [];
    const { columns, rows } = table;
    return rows.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col.name] = row[idx];
        });

        // Dynamic API Family Assignment
        const url = obj.url || '';
        if (url.includes('/erebor/') || url.includes('/shrimagerightdocument/')) obj.apiFamily = 'Erebor';
        else if (url.includes('/elevate-mgu/')) obj.apiFamily = 'Elevate';
        else if (url.includes('/kafka/')) obj.apiFamily = 'Elevate Kafka';
        else obj.apiFamily = 'Other';

        return obj;
    });
}

module.exports = {
    getAPIMLogs,
};
