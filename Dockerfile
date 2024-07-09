FROM node:22.4.0-bullseye-slim
WORKDIR /app 

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "customer_app.js"]