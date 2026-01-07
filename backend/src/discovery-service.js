const { OperationalInsightsManagementClient } = require("@azure/arm-operationalinsights");
const { credential } = require("./azure-client");

class ResourceDiscovery {
    constructor() {
        this.subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        this.resourceGroupName = process.env.AZURE_RESOURCE_GROUP;
        this._client = null;
    }

    get client() {
        if (!this._client) {
            if (!this.subscriptionId) {
                throw new Error("AZURE_SUBSCRIPTION_ID is missing");
            }
            this._client = new OperationalInsightsManagementClient(credential, this.subscriptionId);
        }
        return this._client;
    }

    /**
     * Finds the first Log Analytics Workspace in the configured resource group.
     * @returns {Promise<string>} The Workspace ID (Customer ID).
     */
    async findWorkspaceId() {
        if (!this.subscriptionId || !this.resourceGroupName) {
            throw new Error("AZURE_SUBSCRIPTION_ID and AZURE_RESOURCE_GROUP must be set in .env");
        }

        console.log(`Searching for Log Analytics Workspace in Resource Group: ${this.resourceGroupName}...`);

        try {
            const workspaces = [];
            for await (const workspace of this.client.workspaces.listByResourceGroup(this.resourceGroupName)) {
                workspaces.push(workspace);
            }

            if (workspaces.length === 0) {
                throw new Error(`No Log Analytics Workspaces found in resource group: ${this.resourceGroupName}`);
            }

            const workspace = workspaces[0];
            console.log(`Found Workspace: ${workspace.name} (ID: ${workspace.customerId})`);

            return workspace.customerId;
        } catch (error) {
            console.error("Discovery failed:", error.message);
            throw error;
        }
    }
}

module.exports = new ResourceDiscovery();
