

There are a variety of ways to run the tool based on which folder you're in and whether you're trying to debug in vscode.

The following examples each have three commands. One for showing the help information, one for showing the version, and one for getting the current environment.

### Using ts-node to run the tool 
```
npx ts-node src/index
npx ts-node src/index --version
npx ts-node src/index env
```

### Using npm to run the tool 
The package.json contains a script to run the tool.

>    "start": "ts-node src/index.ts

```
npm run start
npm run start -- --version
npm run start -- env
```

> Note you have to put in an extra `--` otherwise the command line arguments will be passed to npm rather than to the tool.

### Using npm to run the tool 

```
npm run tools
npm run tools -- -- -- --version
npm run tools -- -- -- env
```

### Debugging the Tool
The following 4 settings are the pertinent ones when debugging the tool. Refer to the launch.json for more info
```
            "preLaunchTask": "tsc: build - tsconfig.json",
            "program": "${workspaceFolder}/packages/gqlpages-tools/src/index.ts",
            "outFiles": [
                         "${workspaceFolder}/packages/**/*.js",
                        ],
            "args": ["deploy", "test-data/canada-intl-money-flow","--overwrite","--verbose"]
```

## Commands

### **env**
Gets the enviroment 

```
Executing in folder: C:\gitdev\gqlpages\packages\gqlpages-tools
Database Connection: postgresql://root:***@192.168.2.27:6432/eigql
```