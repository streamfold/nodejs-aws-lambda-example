.PHONY: deploy invoke delete clean

SHELL := /bin/bash

AWS_DEFAULT_REGION ?= us-east-1
FUNCTION_NAME ?= nodejs-aws-lambda-example
AWS_ROLE_ARN ?= set-me

HONEYCOMB_API_KEY ?= super-secret

FUNCTION_NAME ?= rotel-test-nodejs

ZIP_CODE ?= 90210

OT_NODEJS_LAYER=arn:aws:lambda:${AWS_DEFAULT_REGION}:184161586896:layer:opentelemetry-nodejs-0_13_0:1
ROTEL_LAYER=arn:aws:lambda:${AWS_DEFAULT_REGION}:418653438961:layer:rotel-extension-amd64-alpha:24

bundle: index.js rotel-honeycomb.env
	rm -f function.zip && zip function.zip index.js rotel-honeycomb.env

clean:
	rm -f function .zip

deploy: bundle
	aws lambda create-function \
        --function-name ${FUNCTION_NAME} \
        --zip-file fileb://function.zip \
        --runtime nodejs22.x \
        --handler index.handler \
        --environment 'Variables={AWS_LAMBDA_EXEC_WRAPPER=/opt/otel-handler,ROTEL_ENV_FILE=/var/task/rotel-honeycomb.env,OTEL_NODE_ENABLED_INSTRUMENTATIONS="http,aws-lambda,aws-sdk",OTEL_PROPAGATORS="tracecontext,baggage,xray-lambda",HONEYCOMB_API_KEY='"${HONEYCOMB_API_KEY}"'}' \
        --timeout 10 \
        --memory 512 \
        --tracing-config 'Mode=Active' \
        --logging-config LogFormat=JSON \
        --region ${AWS_DEFAULT_REGION} \
        --layers "${ROTEL_LAYER}" "${OT_NODEJS_LAYER}" \
        --role ${AWS_ROLE_ARN}

invoke:
	rm -f outputfile.txt && \
	aws lambda invoke \
          --function-name ${FUNCTION_NAME} \
          --region ${AWS_DEFAULT_REGION} \
          --payload '{"zipCode": "'"${ZIP_CODE}"'"}' \
          --log-type Tail \
          --cli-binary-format raw-in-base64-out \
          outputfile.txt \
          | jq -r '.LogResult' | base64 -d && \
          echo && cat outputfile.txt

delete:
	aws lambda delete-function \
        --function-name ${FUNCTION_NAME} \
        --region ${AWS_DEFAULT_REGION}
