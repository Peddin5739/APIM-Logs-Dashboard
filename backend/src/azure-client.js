const { DefaultAzureCredential } = require('@azure/identity');
const { LogsQueryClient } = require('@azure/monitor-query');

const credential = new DefaultAzureCredential({
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
});
const logsQueryClient = new LogsQueryClient(credential);

module.exports = {
    logsQueryClient,
    credential
};
