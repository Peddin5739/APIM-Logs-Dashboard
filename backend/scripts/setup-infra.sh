#!/bin/bash
# setup-infra.sh

RESOURCE_GROUP="your-resource-group"
LOCATION="eastus"
LAW_NAME="your-law-name"
AI_NAME="your-ai-name"
APIM_NAME="your-apim-name"
PUBLISHER_EMAIL="your-email@example.com"
PUBLISHER_NAME="Your Name"

echo "Creating Resource Group: $RESOURCE_GROUP..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "Creating Log Analytics Workspace: $LAW_NAME..."
az monitor log-analytics workspace create --resource-group $RESOURCE_GROUP --workspace-name $LAW_NAME --location $LOCATION

echo "Creating App Insights: $AI_NAME..."
az monitor app-insights component create --app $AI_NAME --location $LOCATION --resource-group $RESOURCE_GROUP --workspace $LAW_NAME

echo "Creating APIM Service (Consumption): $APIM_NAME..."
# Consumption tier is relatively fast to create.
az apim create --name $APIM_NAME --resource-group $RESOURCE_GROUP --location $LOCATION \
    --publisher-email $PUBLISHER_EMAIL --publisher-name "$PUBLISHER_NAME" \
    --sku-name Consumption

echo "Infrastructure setup complete."
