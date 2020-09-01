FROM node:14

WORKDIR /app

COPY src/package*.json /app/
RUN npm ci --only=production

COPY src/ /app/

EXPOSE 8080

CMD [ "node", "index.js" ]