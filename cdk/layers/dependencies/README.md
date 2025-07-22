# Lambda Layer Dependencies

This directory contains the dependencies for the Lightning Talk Circle Lambda
layer.

## Structure

```
dependencies/
├── nodejs/
│   └── package.json    # Layer dependencies
├── build.sh           # Build script
└── README.md         # This file
```

## Building the Layer

To build the Lambda layer:

```bash
./build.sh
```

This will:

1. Install production dependencies
2. Remove unnecessary files to reduce size
3. Verify the layer is within Lambda's 250MB limit

## Dependencies Included

- AWS SDK v2 & v3 clients
- jsonwebtoken - JWT token handling
- axios - HTTP client
- uuid - UUID generation
- lodash - Utility functions
- moment - Date manipulation
- joi - Data validation

## Usage in Lambda Functions

When using this layer in Lambda functions, the dependencies will be available
at:

- `/opt/nodejs/node_modules/`

Example:

```javascript
const jwt = require('jsonwebtoken');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
```

## Updating Dependencies

1. Edit `nodejs/package.json`
2. Run `./build.sh`
3. Deploy the updated CDK stack

## Size Optimization

The build script automatically removes:

- README files
- Test directories
- Documentation
- GitHub workflows
- Other non-essential files

This helps keep the layer size minimal while retaining functionality.
