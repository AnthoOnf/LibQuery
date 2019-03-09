## Requirements

[Node.js](https://nodejs.org/en/)

## Install

```
npm install
```

## Run

Put the raw newspaper articles in a "data" folder at the root of the project and run
```
npm run start
```

## Output

At the end of the script's execution, you'll get a *result.json* file at the root of the project containing all the articles which could be extracted from the raw newspaper data

## Enrich

Put the *result.json* file in a data folder : /location-recognition/data and run 
```
cd location-recognition
npm run start
```

You will get a *resultWithLocations.json* in /location-recognition/