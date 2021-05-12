# serverless-output-to-env

A Serverless plugin that writes stack outputs to a .env file during after:deploy hook.

## How to use?

Add the plugin to your serverless.yml

    plugins:
      -serverless-output-to-env


Add plugin configuration to serverless.yml

    custom:
      outputToEnv:
        fileName: ../../.env
        map:
          YOUR_ENV_KEY: YourOutput
    resources:
      Outputs:
        YourOutput:
          Value:
            !Ref FooBar

## How to run

It will run automatically in after:deploy hook or you can run it manually with:

```
serverless output-to-env
```

## Parameters

| Name                | Required | Data Type | Default | Description                                                                                                                                                                       |
|---------------------|----------|-----------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| fileName |     Y    |   String  |         | Path to output file                                        |
| map |     Y    |   Object  |         | Key/Value map for .env file key to your output key. 
