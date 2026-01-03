#!/bin/bash
# onboard-api.sh

RESOURCE_GROUP="apim-dashboard-rg"
SERVICE_NAME="apim-dashboard-service"
API_ID="quotes-api"
API_PATH="quotes"
SWAGGER_PATH="/home/naveenpeddi/APIM-Logs-Dashboard/quotes-api-swagger.yaml"
LOGGER_ID="apim-logger"
INSTRUMENTATION_KEY="45ca9070-8507-4f18-b0f7-21a7b02f1fb3"

echo "Importing API from Swagger: $API_ID..."
az apim api import --resource-group $RESOURCE_GROUP --service-name $SERVICE_NAME \
    --path $API_PATH --api-id $API_ID --specification-format OpenApi --specification-path $SWAGGER_PATH

echo "Creating Application Insights Logger: $LOGGER_ID..."
az apim logger create --resource-group $RESOURCE_GROUP --service-name $SERVICE_NAME \
    --name $LOGGER_ID --logger-type applicationInsights --instrumentation-key $INSTRUMENTATION_KEY --description "AppInsights logger for $API_ID"

echo "Configuring Diagnostic Settings for $API_ID..."
az apim api diagnostic create --resource-group $RESOURCE_GROUP --service-name $SERVICE_NAME \
    --api-id $API_ID --diagnostic-id applicationinsights --logger-id $LOGGER_ID \
    --always-log allErrors --http-correlation-protocol W3C --log-client-ip true --sampling 100

echo "Creating Subscription for traffic generation..."
SUB_ID="traffic-generator-sub"
az apim subscription create --resource-group $RESOURCE_GROUP --service-name $SERVICE_NAME \
    --name "$SUB_ID" --subscription-id "$SUB_ID" --scope "/apis/$API_ID" --state active

echo "Retrieving Subscription Key..."
PRIMARY_KEY=$(az apim subscription show --resource-group $RESOURCE_GROUP --service-name $SERVICE_NAME --subscription-id $SUB_ID --query primaryKey -o tsv)

echo "ONBOARDING_COMPLETE"
echo "GATEWAY_URL: https://$SERVICE_NAME.azure-api.net"
echo "SUBSCRIPTION_KEY: $PRIMARY_KEY"

# Update .env for dashboard use
echo "AZURE_LOG_ANALYTICS_WORKSPACE_ID=\"$(az monitor log-analytics workspace show --resource-group $RESOURCE_GROUP --workspace-name apim-dashboard-law --query customerId -o tsv)\"" > /home/naveenpeddi/APIM-Logs-Dashboard/backend/.env
echo "PORT=3001" >> /home/naveenpeddi/APIM-Logs-Dashboard/backend/.env
