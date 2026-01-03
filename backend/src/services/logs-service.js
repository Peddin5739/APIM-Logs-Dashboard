const { logsQueryClient } = require('../azure-client');

async function getAPIMLogs(startTime, endTime) {
    // Use APPREGISTRY_INSTRUMENTATION_KEY or workspaceId if querying through Log Analytics
    // For App Insights, we usually query the Log Analytics workspace it's tied to, 
    // or use the App Insights Resource ID.
    const workspaceId = process.env.AZURE_LOG_ANALYTICS_WORKSPACE_ID;

    if (!workspaceId) {
        throw new Error('AZURE_LOG_ANALYTICS_WORKSPACE_ID is not configured');
    }

    // KQL for status distributions and time series
    const query = `
    AppRequests
    | where TimeGenerated > ago(24h)
    | where Url contains "/quotes"
    | extend statusGroup = strcat(substring(tostring(ResultCode), 0, 1), "00")
    | summarize count = count() by bin(TimeGenerated, 1h), statusGroup
    | order by TimeGenerated desc
  `;

    // Query for raw logs for table and export
    const rawQuery = `
    AppRequests
    | where TimeGenerated > ago(24h)
    | where Url contains "/quotes"
    | project timestamp = TimeGenerated, name = Name, success = Success, resultCode = ResultCode, duration = DurationMs, url = Url
    | order by timestamp desc
    | limit 100
  `;



    try {
        const [statsResult, rawResult] = await Promise.all([
            logsQueryClient.queryWorkspace(workspaceId, query),
            logsQueryClient.queryWorkspace(workspaceId, rawQuery)
        ]);

        console.log(`Query results: stats=${statsResult.tables[0]?.rows?.length || 0} rows, raw=${rawResult.tables[0]?.rows?.length || 0} rows`);

        return {
            stats: processStats(statsResult.tables[0]),
            raw: processRaw(rawResult.tables[0])
        };
    } catch (err) {
        console.error('Error querying logs:', err);
        throw err;
    }
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
        return obj;
    });
}

module.exports = {
    getAPIMLogs,
};
