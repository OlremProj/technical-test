FROM node:18-alpine3.15

USER root

WORKDIR /home/app

COPY ./ ./

COPY  --chown=node package*.json ./

# COPY tsconfig.json file
COPY  --chown=node tsconfig.json ./

RUN npm i

USER node

EXPOSE 3000

CMD [ "npm", "run" ,"start" ]