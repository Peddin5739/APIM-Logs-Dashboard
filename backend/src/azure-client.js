const { DefaultAzureCredential } = require('@azure/identity');
const { LogsQueryClient } = require('@azure/monitor-query');

const credential = new DefaultAzureCredential();
const logsQueryClient = new LogsQueryClient(credential);

module.exports = {
    logsQueryClient,
};
