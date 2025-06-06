# AWS Lambda Rotel + NodeJS Example

This AWS Lambda function showcases the integration of the [Rotel Lambda Extension](https://github.com/streamfold/rotel-lambda-extension) and OpenTelemetry auto-instrumentation layer. It uses the Zippopotam.us API to fetch geographic information, such as latitude and longitude, based on a provided US zip code.

## Functionality

The function accepts a US zip code as input and returns relevant geospatial data in JSON format.

## Integration

By default this example integrates logging and tracing with Honeycomb. If you are not using
Honeycomb and would like to test this with another service, adjust the envfile and environs in the Makefile.

## Deployment Instructions

_Note: Requires the AWS CLI to be installed._

### Bundle function

```shell
make bundle
```

### Deploy function

Required environment variables:
* `AWS_DEFAULT_REGION`: (defaults to us-east-1)
* `AWS_ROLE_ARN`: (Lambda execution role)
* `HONEYCOMB_API_KEY`: API key for environment
* AWS CLI credentials: Credentials required for executing the CLI and creating a function

The following additional environment variables are automatically included:
* `OTEL_NODE_ENABLED_INSTRUMENTATIONS="http,aws-lambda,aws-sdk"`: control which instrumentations to enable
* `OTEL_PROPAGATORS="tracecontext,baggage,xray-lambda"`: makes sure that trace IDs can propagate from AWS to OTEL (particularly useful when exporting to AWS X-Ray)
* `OTEL_SEMCONV_STABILITY_OPT_IN="http"`: enables the latest semantic conventions

```shell
make deploy
```

### Invoke function

Required environment variables:
* `ZIP_CODE`: zip code to lookup (defaults to 90210)
* AWS CLI credentials: Credentials required for executing the CLI and invoking a function

```shell
make invoke
```

### Delete function

If you need to change the configuration, you'll need to delete the function before
recreating it.

Required environment variables:
* AWS CLI credentials: Credentials required for executing the CLI and deleting a function

```shell
make delete
```

## Example Response

```json
{
  "zipCode": "90210",
  "country": "United States",
  "countryAbbreviation": "US",
  "place": "Beverly Hills",
  "state": "California",
  "stateAbbreviation": "CA",
  "latitude": "34.0901",
  "longitude": "-118.4065"
}
```

## Error Handling

The function will return appropriate error responses:

- Missing zip code: 400 Bad Request
- Invalid zip code format: 400 Bad Request
- Zip code not found: 404 Not Found
- API service issues: 500 Internal Server Error
