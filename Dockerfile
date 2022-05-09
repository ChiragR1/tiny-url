FROM node:latest
WORKDIR /tiny-url-app
COPY package.json .
RUN npm install
COPY . .
CMD npm start