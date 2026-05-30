# Rivet

![Version](https://img.shields.io/github/package-json/v/IgosProjects/rivet)
![License](https://img.shields.io/github/license/IgosProjects/rivet)
![TypeScript](https://img.shields.io/github/languages/top/IgosProjects/rivet)
![Lines](https://img.shields.io/tokei/lines/github/IgosProjects/rivet)

Rivet is a small Typescript based server platform for NodeJS, it is a Express inspired library for servers

# Installing

To install Rivet you will need to have an NPM project setup, if not run the necessary commands.
Then you can run this command to install rivet:```npm install @igosprojects/rivet```

# Usage

To use Rivet you first need to install it using your package manager(look at [Installing](#installing)).

## Creating a basic server

To create a basic server you will need to initilize Rivet, and start the server. The following code does just that:
```ts 
import { IncomingMessage } from 'node:http';
import { Rivet, RivetResponse } from '@igosprojects/rivet';

const app = new Rivet();

// This function is called when the route "/" is called
app.get('/', (req: IncomingMessage, res: RivetResponse) => {
    res.send("hi!");
});

app.start(3000);
```

## Serving static files

Rivet supports serving static files and folders, to do so you can use the ```app.static``` function after initilizing the server. 
For example this code will serve the public directory next to the file:
```ts
import { Rivet } from '@igosprojects/rivet';

const app = new Rivet();

app.static("/", "./public");

app.start(3000); 
```

## Reading parameters(/:id)

Rivet can read parameters passed on the URL bar, to do that you can use the ```req.params``` option for that. 
To read the parameters you can do: ```const { paramname } = req.params;```, now paramname is equal to the parameter if it was passed in.
To register routes with parameters you shouldnt register ```/users``` but instead ```/users/:id``` otherwise it wont work!