#!/bin/bash
# onboard-api-rest.sh

SUBSCRIPTION="YOUR_SUBSCRIPTION_ID"
RG="your-resource-group"
SERVICE="your-apim-service-name"
API_ID="quotes-api"
API_PATH="quotes"
SWAGGER_PATH="./quotes-api-swagger.yaml"
LOGGER_ID="apim-logger"
INSTRUMENTATION_KEY="YOUR_APP_INSIGHTS_KEY"
API_VERSION="2022-08-01"

echo "1. Importing API..."
az apim api import --resource-group $RG --service-name $SERVICE --path $API_PATH --api-id $API_ID --specification-format OpenApi --specification-path $SWAGGER_PATH

echo "2. Creating Logger via REST..."
LOGGER_URL="https://management.azure.com/subscriptions/$SUBSCRIPTION/resourceGroups/$RG/providers/Microsoft.ApiManagement/service/$SERVICE/loggers/$LOGGER_ID?api-version=$API_VERSION"
LOGGER_BODY="{\"properties\": {\"loggerType\": \"applicationInsights\", \"description\": \"AppInsights Logger\", \"credentials\": {\"instrumentationKey\": \"$INSTRUMENTATION_KEY\"}}}"
az rest --method put --url "$LOGGER_URL" --body "$LOGGER_BODY"

echo "3. Enabling Diagnostics via REST..."
DIAG_URL="https://management.azure.com/subscriptions/$SUBSCRIPTION/resourceGroups/$RG/providers/Microsoft.ApiManagement/service/$SERVICE/apis/$API_ID/diagnostics/applicationinsights?api-version=$API_VERSION"
LOGGER_RESOURCE_ID="/subscriptions/$SUBSCRIPTION/resourceGroups/$RG/providers/Microsoft.ApiManagement/service/$SERVICE/loggers/$LOGGER_ID"
DIAG_BODY="{\"properties\": {\"loggerId\": \"$LOGGER_RESOURCE_ID\", \"alwaysLog\": \"allErrors\", \"sampling\": {\"samplingType\": \"fixed\", \"percentage\": 100}, \"httpCorrelationProtocol\": \"W3C\", \"logClientIp\": true}}"
az rest --method put --url "$DIAG_URL" --body "$DIAG_BODY"

echo "4. Creating Subscription via REST..."
SUB_ID="traffic-generator-sub"
SUB_URL="https://management.azure.com/subscriptions/$SUBSCRIPTION/resourceGroups/$RG/providers/Microsoft.ApiManagement/service/$SERVICE/subscriptions/$SUB_ID?api-version=$API_VERSION"
SUB_BODY="{\"properties\": {\"displayName\": \"Traffic Gen Sub\", \"scope\": \"/apis/$API_ID\", \"state\": \"active\"}}"
az rest --method put --url "$SUB_URL" --body "$SUB_BODY"

echo "5. Retrieving Subscription Key..."
KEY_URL="https://management.azure.com/subscriptions/$SUBSCRIPTION/resourceGroups/$RG/providers/Microsoft.ApiManagement/service/$SERVICE/subscriptions/$SUB_ID/listSecrets?api-version=$API_VERSION"
PRIMARY_KEY=$(az rest --method post --url "$KEY_URL" --query primaryKey -o tsv)

echo "ONBOARDING_COMPLETE"
echo "GATEWAY_URL: https://$SERVICE.azure-api.net"
echo "SUBSCRIPTION_KEY: $PRIMARY_KEY"

# Update Dashboard .env
echo "AZURE_LOG_ANALYTICS_WORKSPACE_ID=\"$(az monitor log-analytics workspace show --resource-group $RG --workspace-name apim-dashboard-law --query customerId -o tsv)\"" > /home/naveenpeddi/APIM-Logs-Dashboard/backend/.env
echo "PORT=3001" >> /home/naveenpeddi/APIM-Logs-Dashboard/backend/.env
